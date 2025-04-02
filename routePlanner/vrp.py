#!/usr/bin/env python3
# Copyright 2010-2022 Google LLC
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Simple prize collecting VRP problem with a max distance."""
import pandas as pd
import random
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
from ortools.constraint_solver.pywrapcp import SolutionCollector
import csv
import requests
import sys
profit_scale_multiplier = 10e4
recommended_pois_multiplier = 1.3
mandatory_pois_multiplier = 10
cutoff_threshold = 0.5
preferred_pois_threshold = 0.7
urls={
    "driving-car":"",
    "cycling-regular":"",
    "foot-walking":""
}
class ItineraryPlanner:
    #exclude POIS by setting a too long visiting time
    def excludePOIS(self):
        print("Excluding POIS. Length of pois visiting times: ",len(self.data["visiting_time"]))
        for poi in self.data["ids_to_exclude"]:
            print(poi)
            self.data["visiting_time"][self.pois_to_or_ids[poi]] = 2*self.data["day_duration"]
    #Function that creates routing objects, i.e. manager, routing, search parameters
    def createRoutingObjects(self):
        #First, exclude all the points in the exclude list
        self.excludePOIS()
        num_nodes = len(self.data["time_matrix"])
        print(f'Num nodes = {num_nodes}')
        depot = self.data["depot"]
        # Create the routing index manager.
        manager = pywrapcp.RoutingIndexManager(
                num_nodes,
                self.data["number_days"],
                self.data["depot"])
        # Create routing model.
        routing = pywrapcp.RoutingModel(manager)

        # Create and register a transit callback.
        def time_callback(from_index, to_index):
            #Returns the travel time between the two nodes.
            # Convert from routing variable Index to distance matrix NodeIndex.
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            return self.data["time_matrix"][from_node][to_node] + self.data["visiting_time"][to_node]

        transit_callback_index = routing.RegisterTransitCallback(time_callback)
        # Define cost of each arc.
        routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
        # Limit Vehicle time.
        dimension_name = 'Time'
        routing.AddDimension(
            transit_callback_index,
            0,  # no slack
            self.data["day_duration"],  # vehicle maximum travel time
            True,  # start cumul to zero
            dimension_name)
        time_dimension = routing.GetDimensionOrDie(dimension_name)
        time_dimension.SetGlobalSpanCostCoefficient(1)
        # Add time window constraints for each location except depot.
        for location_idx, time_window in enumerate(self.data["time_windows"]):
            if location_idx == self.data["depot"]:
                continue
            index = manager.NodeToIndex(location_idx)
            time_dimension.CumulVar(index).SetRange(time_window[0], time_window[1])
                
        # Add time window constraints for each vehicle start node.
        depot_idx = self.data["depot"]
        for vehicle_id in range(self.data["number_days"]):
            index = routing.Start(vehicle_id)
            time_dimension.CumulVar(index).SetRange(
            self.data["time_windows"][depot_idx][0], self.data["time_windows"][depot_idx][1]
        )
        for i in range(self.data["number_days"]):
            routing.AddVariableMinimizedByFinalizer(
                time_dimension.CumulVar(routing.Start(i))
        )
        routing.AddVariableMinimizedByFinalizer(time_dimension.CumulVar(routing.End(i)))
        # Allow to drop nodes.
        for node in range(0, num_nodes):
            routing.AddDisjunction(
                    [manager.NodeToIndex(node)],
                    self.data["visit_values"][node])
        # Setting first solution heuristic.
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        #https://developers.google.com/optimization/routing/routing_options
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC)
        search_parameters.local_search_metaheuristic = (
            routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH)
        search_parameters.time_limit.FromSeconds(3)
        search_parameters.log_search = False
        return manager,routing, search_parameters

    def getRoutes(self):
        routes = []
        for i in range(self.data["n_alternatives"]):
            # Solve the problem.
            manager,routing, search_parameters = self.createRoutingObjects()
            # Solve the problem.
            assignment = routing.SolveWithParameters(search_parameters)
            # Print solution on console.
            if assignment:
                route=self.get_solution(manager, routing, assignment)
                routes.append(route)
        return routes
    # Create a console solution printer.
    def get_solution(self, manager, routing, assignment):
        #Prints assignment on console.
        print(f'Objective: {assignment.ObjectiveValue()}')
        # Display dropped nodes.
        dropped_nodes = 'Dropped nodes:'
        for index in range(routing.Size()):
            if routing.IsStart(index) or routing.IsEnd(index):
                continue
            if assignment.Value(routing.NextVar(index)) == index:
                node = manager.IndexToNode(index)
                dropped_nodes += f' {node}({self.data["visit_values"][node]})'
        # Display routes
        total_duration = 0
        total_value_collected = 0
        itinerary=dict()
        itinerary["steps"]=[]
        for v in range(manager.GetNumberOfVehicles()):
            index = routing.Start(v)
            plan_output = f'Route for vehicle {v}:\n'
            day_total_duration = 0
            value_collected = 0
            time_spent=0
            route_or_ids = []
            route_pois_ids=[]
            step = 0
            while not routing.IsEnd(index):
                node = manager.IndexToNode(index)
                rasta_poi_index=int(self.or_to_pois_ids[node])
                value_collected += self.data["visit_values"][node]
                route_or_ids.append((node,self.data["visit_values"][node]))
                arc_cost = routing.GetArcCostForVehicle(previous_index, index, v) if node!=0 else 0
                total_duration = total_duration + arc_cost        
                day_total_duration = day_total_duration + arc_cost
                route_pois_ids.append({"day":v,\
                                        "order_step":step,\
                                        "id_geo":rasta_poi_index,\
                                        "t_visit_min":self.data["visiting_time"][node],\
                                        "t_end":day_total_duration
                                            })
                plan_output += f' {rasta_poi_index} {arc_cost} {self.data["visit_values"][node]}->'
                previous_index = index
                index = assignment.Value(routing.NextVar(index))
                step+=1
            total_duration += routing.GetArcCostForVehicle(previous_index, index, v)
            day_total_duration += routing.GetArcCostForVehicle(previous_index, index, v)
            node = manager.IndexToNode(index)
            rasta_poi_index=int(self.or_to_pois_ids[node])
            route_pois_ids.append({"day":v,\
                                       "order_step":step,\
                                       "id_geo":rasta_poi_index,\
                                       "t_visit_min":self.data["visiting_time"][node],\
                                       "t_end":day_total_duration
                                        })
            route_pois_ids[0]["id_geo"]=self.data["id_start"]
            route_pois_ids[-1]["id_geo"]=self.data["id_start"]
            plan_output += f' {rasta_poi_index} {routing.GetArcCostForVehicle(previous_index, index, v)} {self.data["visit_values"][node]}'
            plan_output += f'\nDistance of the route for day {v}: {day_total_duration}s\n'
            plan_output += f'Value collected: {value_collected}\n'
            print("Route: ",plan_output)
            total_value_collected += value_collected
            for step in route_pois_ids:
                itinerary["steps"].append(step)
            route_or_ids = route_or_ids[1:]
            for i in range(min(2,len(route_or_ids))):
                minimum_poi_index=route_or_ids.index((min(route_or_ids,key=lambda x:x[1])))
                #change visiting time for minimum profit node
                poi_id = route_or_ids[minimum_poi_index][0]
                self.data["ids_to_exclude"].append(poi_id)
                #delete minimum poi
                route_or_ids.pop(minimum_poi_index)
        itinerary["total_duration"] = total_duration
        itinerary["lat_start"] = self.data["lat_start"]
        itinerary["long_start"] = self.data["long_start"]
        itinerary["id_start"] = self.data["id_start"]

        print(f'Total time: {total_duration}s')
        print(f'Total Value collected: {total_value_collected}/{sum(self.data["visit_values"])}')
        if total_duration > 0:
            print(itinerary)
            return itinerary
        else:
            return False

    def get_status(self):
        if self.data["status"] == "error":
            return self.data["error"]
        return {"status":"ok"}
    
    def __init__(self,pois,id_start,long_start, lat_start, day_duration ,number_days,poi_max_duration,ids_to_exclude,ids_to_include,transport_mean,n_alternatives=1):
        self.data = {}
        self.data["id_start"] = id_start
        try:
            if self.data["id_start"] != 0:
                df_municipalities=pd.read_csv("municipalities.csv",header=0,sep=",")
                self.data["lat_start"]=df_municipalities[df_municipalities["rasta_id"]==self.data["id_start"]]["lat"].values[0]
                self.data["long_start"]=df_municipalities[df_municipalities["rasta_id"]==self.data["id_start"]]["lon"].values[0]
            else:
                self.data["long_start"] = long_start
                self.data["lat_start"] = lat_start
            #convert day duration to seconds
            self.data["day_duration"] = day_duration * 60
            #number of days (vehicles in VRP)
            self.data["number_days"] = number_days
            #Car,bike,foot
            self.data["transport_mean"] = transport_mean
            #Different travel plans to compute
            self.data["n_alternatives"] = n_alternatives
            #Starting point (always 0)
            self.data["depot"] = 0
            print("Start ID: {0}, transport mean: {1}".format(self.data["id_start"],self.data["transport_mean"]))
            time_matrix_df=pd.read_csv("./duration_matrices/{0}_{1}_durations.csv".format(self.data["id_start"],self.data["transport_mean"]),index_col=0,header=0).astype('int')
            time_matrix_df.columns = time_matrix_df.columns.map(int)
            pois_df=pd.read_csv("pois_complete.csv",index_col="id").astype({'visiting_time':int})
            if self.data["id_start"] == 0:
                locations=[[self.data["long_start"],self.data["lat_start"]]]
                locations.extend(list(map(list,zip(pois_df["longitude"].values, pois_df["latitude"].values))))
                body = {"locations":locations,"sources":[0]}
                headers = {
                    'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
                    'Content-Type': 'application/json; charset=utf-8'
                }
                call = requests.post(urls[self.data["transport_mean"]], json=body, headers=headers)                
                if "error" in call.json():
                    self.data["status"] = "error"
                    self.data["error"] = call.json()
                else:
                    pois = sorted(pois, key=lambda d: d['id_geo'])
                    distances_from_source = call.json()["durations"][0]
                    #distances from the starting point (passed by frontend)
                    distances_from_source = [int(x) if x is not None else 30000 for x in distances_from_source]
                    #Populate starting point column and row
                    time_matrix_df[0]=distances_from_source
                    time_matrix_df.iloc[0]=distances_from_source
                    self.data["time_matrix"] = time_matrix_df.values
                    #mapping from or-tools ids (fom 0 to npois-1) to RASTA ids
                    pois_ids = time_matrix_df.index
                    self.or_to_pois_ids={}
                    #mapping from RASTA ids to or-tools ids (fom 0 to npois-1)
                    self.pois_to_or_ids={}
                    for i in range (0, len(pois_ids)):
                        self.or_to_pois_ids[i] = pois_ids[i]
                        self.pois_to_or_ids[pois_ids[i]] = i
                    #Profits for nodes (must be integer), passed by frontend
                    self.data["visit_values"]=[0]+[int(element["score"]*profit_scale_multiplier) if element["score"]<preferred_pois_threshold else int(element["score"]*recommended_pois_multiplier*profit_scale_multiplier) for element in pois]
                    self.data["ids_to_include"] = ids_to_include
                    for rasta_poi_id in self.data["ids_to_include"]:
                        self.data["visit_values"][self.pois_to_or_ids[rasta_poi_id]] *=mandatory_pois_multiplier
                    #Ids to exclude from computation (e.g. already visited), passed by frontend
                    self.data["ids_to_exclude"] = [element["id_geo"] for element in pois if element["score"]<cutoff_threshold]
                    print("ALREADY EXCLUDED:", len(self.data["ids_to_exclude"]))
                    for rasta_poi_id_to_exclude in ids_to_exclude:
                        #map id_to_exclude (RASTA ID) to or-tools id
                        self.data["ids_to_exclude"].append(self.pois_to_or_ids[rasta_poi_id_to_exclude])
                    #Maximum duration for a poi
                    self.data["poi_max_duration"] = poi_max_duration
                    #Visiting times, loaded from file passed by backend, sorted by ids
                    #self.data["visiting_time"]={0:0}
                    #self.data["visiting_time"].update({ int(k):int(v) for (k,v) in zip(pois_df["visiting_time"].index.values, pois_df["visiting_time"].values)})
                    self.data["visiting_time"]=[0]+[60*int(x) for x in pois_df["visiting_time"].values]
                    #exclude POI if visiting time > poi_max_duration
                    for id in pois_df[pois_df["visiting_time"]>poi_max_duration].index.values:
                        self.data["ids_to_exclude"].append(self.pois_to_or_ids[poi_rasta_id])
                    with open("visiting_times.csv","r") as f:
                        csvReader = csv.reader(f)
                        for row in csvReader:
                            poi_rasta_id = int(row[0])
                            poi_time = int(row[1]) * 60                        
                            self.data["visiting_time"][self.pois_to_or_ids[poi_rasta_id]]=poi_time
                            self.data["time_windows"].append((int(row[2]),int(row[3])))
                    #Time windows (opening times)
                    self.data["time_windows"]=[(0,86400) for i in range(len(self.data["visiting_time"]))]            
                    self.data["time_windows"][self.data["depot"]]=(0,86400)
                    self.data["status"] = "ok"
                    print("STATUS: ",self.data["status"])
        except Exception as e:
            print("EXCEPTION: ",e)
            self.data["status"] = "error"
            self.data["error"] = call.json()
        
        