from flask import Flask, request, jsonify,redirect
from flask_cors import CORS, cross_origin
#from flasgger import swag_from
from flasgger import Swagger
import vrp
import json
import pandas as pd
import requests
import sys
from flask import Response
app = Flask("application")
"""swagger = Swagger(app,config = {"specs_route": "/api-docs/"}
 ,merge=True,template={
    "info": {
        "title": "Travel Planner Api",
        "description": "RASTA Travel Planner API",
        "version": "1.0.0"
    }
})"""
swagger = Swagger(app,config = {"specs_route": "/api-docs/",
                                "static_folder": "/rasta/routeplanner/static",
                                "static_url_path":"/rasta/routeplanner/static",
                                "specs": [
                                    {
                                    "endpoint": 'apispec_1',
                                    "route": "/rasta/routeplanner/apispec_1.json",
                                    "rule_filter": lambda rule: True,  # all in
                                    "model_filter": lambda tag: True,  # all in
                                    }
                                ],
                                }
 ,merge=True,template={
    "info": {
        "title": "Travel Planner Api",
        "description": "RASTA Travel Planner API",
        "version": "1.0.0"
    },
})


CORS(app)

@app.route('/apispec_1.json')
def redirect_apidocs():
  print("REDIRECT")
  return redirect('', code=302)

# RESTful POST endpoint
#@swag_from('./routeplanner.yaml')
@cross_origin(origin='*')
@app.route('/', methods=['POST'])
def post_data():
    """
    request
    ---
    parameters:
    - in: header
      name: accept-language
      schema:
        type: string
      description:
        The user's preferred response language.
    - in: body
      name: body
      required: true
      schema:
          type: object
          properties:
            pois:
              type: array
              items:
                type: object
                properties:
                  id_geo:
                    type: integer
                    format: int32
                    example: 1
                    description: POI identifier
                  score:
                    type: number
                    format: float
                    example: 0.5
                    description: POI score for user
            id_start:
              type: number
              format: int
              example: 0
              description: 0 for custom position, else municipality id from 1 to 92 (Umbria municipalities)
            lat_start:
              type: number
              format: float
              example: 43.11203539290401
              description: latitude of the custom starting point 
            long_start:
              type: number
              format: float
              example: 12.388962521256484
              description: latitude of the custom starting point
            day_duration:
              type: integer
              format: int32
              example: 28800
              description: Maximum duration of a daily tour (seconds)
            days:
              type: integer
              format: int32
              example: 3
              description: Number of days in an itinerary
            poi_max_duration:
              type: integer
              format: int32
              example: 3600
              description: Maximum duration for a POI visit (seconds). POIs which require longer visiting time will be excluded;
            ids_to_exclude:
              type: array
              items:
                type: integer
                format: int32
                description: Array of id_geo to be mandatorily excluded from the itinerary;
            ids_to_include:
              type: array
              items:
                type: integer
                format: int32
                description: Array of id_geo to be mandatorily included in the itinerary;
            transport_mean:
              type: string
              example: 'driving-car'
              description: driving-car,cycling-regular,foot-walking
            n_alternatives:
              type: integer
              format: int32
              example: 2
              description: Number of alternative itineraries to be computed. Between 1 and 3
    tags:
    - Route Planner Service
    summary: Get itineraries
    description: Request itineraries
    responses:
      200:
        description: Successful operation
        schema:
          type: array
          items:
            type: object
            properties:
              id_start:
                type: number
                format: int
                example: 0
                description: 0 for custom position, else municipality id from 1 to 92 (Umbria municipalities)
              lat_start:
                type: number
                format: float
                example: 43.11203539290401
                description: latitude of the custom starting point 
              long_start:
                type: number
                format: float
                example: 12.388962521256484
                description: latitude of the custom starting point
              total_duration:
                type: integer
                format: int32
                example: 100000
                description: Total duration of the itinerary (seconds)
              steps:
                type: array
                items:
                  type: object
                  properties:
                    day:
                      type: integer
                      format: int32
                      example: 1
                      description: Day the step belongs to
                    order_step:
                      type: integer
                      format: int32
                      example: 1
                      description: Step order in the corresponding day
                    id_geo:
                      type: integer
                      format: int32
                      example: 1
                      description: POI id 
                    t_visit_ min:
                      type: integer
                      format: int32
                      example: 1000
                      description: POI visiting time (seconds)
                    t_end:
                      type: integer
                      format: int32
                      example: 1000
                      description: Time passed since beginning of day tour after POI visit (seconds)
      400:
        description: Wrong starting coordinates
    """
    content = request.json
    print(request.headers)
    language = request.headers["accept-language"]
    #language = "it"
    if content:
        #fp = open("pois.json","r")
        #pois=json.load(fp)
        pois = content.get('pois')
        id_start = content.get('id_start')
        long_start = content.get('long_start')
        lat_start = content.get('lat_start')
        day_duration = content.get('day_duration')
        number_days = content.get('days')
        poi_max_duration = content.get('poi_max_duration')
        ids_to_exclude = content.get("ids_to_exclude")
        ids_to_include = content.get("ids_to_include")
        transport_mean = content.get("transport_mean")
        n_alternatives = content.get("n_alternatives")
        planner = vrp.ItineraryPlanner(pois,id_start,long_start,lat_start,day_duration,number_days,poi_max_duration,ids_to_exclude,ids_to_include,transport_mean,n_alternatives)
        status = planner.get_status()
        if "error" in status:
            if status["error"]["code"] == 6010:
                if language == "en":
                    return Response({"Wrong starting coordinates"}, status=400, mimetype='application/json')
                elif language == "it":
                    return Response({"Coordinate iniziali errate"}, status=400, mimetype='application/json')
        routes=planner.getRoutes()
        return jsonify((routes))
    else:
        return jsonify({'status': 'error', 'message': 'No JSON data received'})

if __name__ == '__main__':
    app.run(host='0.0.0.0',debug=True)
    print("SERVER STARTED\n")