import { Action } from './action.interface';

export const NoAuthUserActions: Action[] = [
  {
    action: 'toolbar_action.home_action_key',
    url: '',
    icon: 'home',
  },
  {
    action: 'toolbar_action.new_itinerary_action_key',
    url: '/itinerary',
    icon: 'add_location',
  },
];

const AuthUserActions: Action[] = NoAuthUserActions.concat([
  {
    action: 'toolbar_action.profile_action_key',
    url: '/profile',
    icon: 'account_circle',
  },
]);

export const AuthTouristActions: Action[] = AuthUserActions.concat([
  {
    action: 'toolbar_action.saved_tour_action_key',
    url: '/tourist/saved-tour',
    icon: 'map',
  },
]);


let adminArray=AuthUserActions.concat([
  {
    action: 'toolbar_action.handle_poi_action_key',
    url: '/admin/handle-poi',
    icon: 'settings',
  },
  {
    action: 'toolbar_action.handle_toi_action_key',
    url: '/admin/handle-toi',
    icon: 'settings',
  },
  {
    action: 'toolbar_action.add_admin_action_key',
    url: '/admin/add-admin',
    icon: 'person_add',
  },
  {
    action: 'toolbar_action.show_visualization_action_key',
    url: '/admin/visualization',
    icon: 'show_chart',
  },
]);


export const AuthAdminActions: Action[] =adminArray.slice(0, 1).concat(adminArray.slice(2))
