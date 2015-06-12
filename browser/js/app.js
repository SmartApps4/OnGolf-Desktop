// OnGolf - Quick Profiler app
// ------------------------------------------------- //

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'OnGolf' is the name of this angular module 
// the 2nd parameter is an array of 'requires'
// 'onGolf.services' is found in services.js
// 'onGolf.controllers' is found in controllers.js
// 'onGolf.directives' is found in directives.js


angular.module('onGolf', ['ionic', 'ngCordova', 'angularMoment', 'onGolf.controllers', 'onGolf.services', 'onGolf.directives', 
  'angulartics', 'angulartics.google.analytics', 'firebase', 'angular.filter', 'ct.ui.router.extras', 'SA4.CRM'])

//Load config items from Firebase
//.constant("CRMConfig", "https://sa4-apps-config.firebaseio.com/OnGolf-Prod")

.run(function($ionicPlatform, $cordovaStatusbar) {
  $ionicPlatform.ready(function() {
    // Request Permission for Local Notification on IOS
    if(device.platform === "iOS") {
        window.plugin.notification.local.registerPermission();
    }
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      // cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      $cordovaStatusbar.style(1);
    }
  });
})

// Set Android Tabs to bottom so we don't hide button bar
.config(['$ionicConfigProvider', function($ionicConfigProvider) {

$ionicConfigProvider.tabs.position('bottom'); //other values: top

}])

.config(function ($analyticsProvider) {
      $analyticsProvider.firstPageview(true); /* Records pages that don't use $state or $route */
      $analyticsProvider.withAutoBase(true);  /* Records full path */
})


.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  //Intro State
  .state('intro', {
    url: '/intro',
    templateUrl: 'templates/intro.html',
    controller: 'IntroCtrl',
    resolve: {
        didTutorial : function() {
          return window.localStorage.didTutorial;
        }
      }
    })

  // Login State
  .state('login', {
    url: "/login",
    templateUrl: "templates/_login.html",
    controller: 'LoginCtrl'
    
    /*
    resolve: {
        CRMData: function($firebaseObject) {
          var ref = new Firebase(CRMConfig); 
          return $firebaseObject(ref).$loaded(); 

        },
        CRM: 'CRM',
          currentCRM: function(CRM,CRMData){
            CRM.overrideCRMData(CRMData);
            return CRM.getCRM(CRMData.config.CRM);
        }
      }
    */
  })


  // setup an abstract state for the tabs directive
    .state('tab', {
    url: "/tab",
    abstract: true,
    templateUrl: "templates/tabs.html",
    controller: 'tabsCtrl',
    resolve: {
        CRMData: function(CRM, $firebaseObject) {
          var currentCRM = CRM.getConfig(); 
          var ref = new Firebase(currentCRM.CRMConfig); 
          return $firebaseObject(ref).$loaded(); 

        },
        CRM: 'CRM',
          currentCRM: function(CRM,CRMData){
            CRM.overrideCRMData(CRMData);
            return CRM.getCRM(CRMData.config.CRM);
        }
    }
  })

  // Contacts States
  .state('tab.contacts', {
      url: '/contacts',
      views: {
        'tab-contacts': {
          templateUrl: 'templates/tab-contacts.html',
          controller: 'ContactsCtrl'
        }
      }
    })

    // Contact Detail
    .state('tab.contact-detail', {
      url: '/contacts/:contactId',
      views: {
        'tab-contacts': {
          templateUrl: 'templates/contact-detail.html',
          controller: 'ContactDetailCtrl'
        }
      }
    })

     // Course from Contact Detail
    .state('tab.contact-detail-course', {
      url: '/contacts/:contactId/courses/:courseId',
      views: {
        'tab-contacts': {
          templateUrl: 'templates/course-detail.html',
          controller: 'CourseDetailCtrl'
        }
      }
    })

  // Contact Activity Detail
    .state('tab.contact-activity-detail', {
      url: '/contacts/:contactId/activities/:activityId',
      views: {
        'tab-contacts': {
          templateUrl: 'templates/activity-detail.html',
          controller: 'ActivityDetailCtrl'
        }
      }
    })

  // Contact Activity Detail
    .state('tab.contact-history-detail', {
      url: '/contacts/:contactId/history/:historyId',
      views: {
        'tab-contacts': {
          templateUrl: 'templates/history-detail.html',
          controller: 'HistoryDetailCtrl'
        }
      }
    })

    // Contact Activity Detail
    .state('tab.activity-detail', {
      url: '/activities/:activityId',
      views: {
        'tab-contacts': {
          templateUrl: 'templates/activity-detail.html',
          controller: 'ActivityDetailCtrl'
        }
      }
    })

    // Course States
    .state('tab.courses', {
      url: '/courses',
      views: {
        'tab-courses': {
          templateUrl: 'templates/tab-courses.html',
          controller: 'CoursesCtrl'
        }
      }
    })

     // Course Detail
    .state('tab.course-detail', {
      url: '/courses/:courseId',
      views: {
        'tab-courses': {
          templateUrl: 'templates/course-detail.html',
          controller: 'CourseDetailCtrl'
        }
      }
    })

    // Course Contact Detail
    .state('tab.course-contact-detail', {
      url: '/courses/:courseId/contacts/:contactId',
      views: {
        'tab-courses': {
          templateUrl: 'templates/contact-detail.html',
          controller: 'ContactDetailCtrl'
        }
      }
    })

    // Course Contact Detail
    .state('tab.course-contact-activity-detail', {
      url: '/courses/:courseId/contacts/:contactId/activities/:activityId',
      views: {
        'tab-courses': {
          templateUrl: 'templates/activity-detail.html',
          controller: 'ActivityDetailCtrl'
        }
      }
    })

     // Course Contact Detail
    .state('tab.course-contact-history-detail', {
      url: '/courses/:courseId/contacts/:contactId/history/:historyId',
      views: {
        'tab-courses': {
          templateUrl: 'templates/history-detail.html',
          controller: 'HistoryDetailCtrl'
        }
      }
    })

     // Contact Activity Detail
    .state('tab.course-activity-detail', {
      url: '/courses/:courseId/activities/:activityId',
      views: {
        'tab-courses': {
          templateUrl: 'templates/activity-detail.html',
          controller: 'ActivityDetailCtrl'
        }
      }
    })

     // Contact Activity Detail
    .state('tab.course-history-detail', {
      url: '/courses/:courseId/history/:historyId',
      views: {
        'tab-courses': {
          templateUrl: 'templates/history-detail.html',
          controller: 'HistoryDetailCtrl'
        }
      }
    })



    // Calendar State
  .state('tab.calendar', {
    url: '/calendar',
    views: {
      'tab-calendar': {
        templateUrl: 'templates/tab-calendar.html',
        controller: 'CalendarCtrl'
      }
    }
  })


  // Calendar Task Detail
   .state('tab.calendar-activity-detail', {
      url: '/activities/:activityId',
      views: {
        'tab-calendar': {
          templateUrl: 'templates/activity-detail.html',
          controller: 'ActivityDetailCtrl'
        }
      }
    })

  // Campaign States
    .state('tab.campaigns', {
      url: '/campaigns',
      views: {
        'tab-campaigns': {
          templateUrl: 'templates/tab-campaigns.html',
          controller: 'CampaignsCtrl'
        }
      }
    })

     // Campaign Detail
    .state('tab.campaign-detail', {
      url: '/campaigns/:campaignId',
      views: {
        'tab-campaigns': {
          templateUrl: 'templates/campaign-detail.html',
          controller: 'CampaignDetailCtrl'
        }
      }
    })

    // Campaign Detail
    .state('tab.campaign-contact-detail', {
      url: '/campaigns/:campaignId/contacts/:contactId',
      views: {
        'tab-campaigns': {
          templateUrl: 'templates/contact-detail.html',
          controller: 'ContactDetailCtrl'
        }
      }
    })

     // Course Contact Detail
    .state('tab.campaign-contact-activity-detail', {
      url: '/campaigns/:campaignId/contacts/:contactId/activities/:activityId',
      views: {
        'tab-campaigns': {
          templateUrl: 'templates/activity-detail.html',
          controller: 'ActivityDetailCtrl'
        }
      }
    })


   // Settings

  .state('tab.settings', {
    url: '/settings',
    views: {
      'tab-settings': {
        templateUrl: 'templates/tab-settings.html',
        controller: 'SettingsCtrl'
      }
    }
  })

    .state('tab.faq', {
    url: "/settings/faq",
    views: {
      'tab-settings': {
        templateUrl: "templates/faq.html",
         controller: 'QuestionCtrl'
      }
    }
  })

     .state('tab.faqDetail', {
    url: "/settings/faq/:questionId",
    views: {
      'tab-settings': {
        templateUrl: "templates/faqDetail.html",
         controller: 'QuestionDetailCtrl'
      }
    }
  })

  .state('tab.profile', {
    url: '/settings/profile',
    views: {
      'tab-settings': {
        templateUrl: 'templates/settings/profile.html',
        controller: 'SettingsCtrl'
      }
    }
  })

  .state('tab.account', {
    url: '/settings/account',
    views: {
      'tab-settings': {
        templateUrl: 'templates/settings/account.html',
        controller: 'SettingsCtrl'
      }
    }
  })

  .state('tab.notfications', {
    url: '/settings/notifications',
    views: {
      'tab-settings': {
        templateUrl: 'templates/settings/notifications.html',
        controller: 'SettingsCtrl'
      }
    }
  })

   .state('tab.emailAlerts', {
    url: '/settings/email',
    views: {
      'tab-settings': {
        templateUrl: 'templates/settings/email.html',
        controller: 'SettingsCtrl'
      }
    }
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');

});
