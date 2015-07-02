// Controller Groups
// ------------------------------------------------- //
// 1 - Login Controller
// 2 - Contacts Controllers
// 3 - Courses Controllers
// 4 - Campaigns Controllers
// 5 - Settings Controllers
// ------------------------------------------------- //

angular.module('onGolf.controllers', [])

// Intro CONTROLLER
// ------------------------------------------------- //
.controller('IntroCtrl', function($scope, $state, $ionicSlideBoxDelegate, didTutorial) {

  // Hide Splashscreen Gracefully - https://calendee.com/2015/03/03/polish-app-launch-with-cordova-splashscreen-plugin/
  $scope.$on('$ionicView.loaded', function() {
  ionic.Platform.ready( function() {
    if(didTutorial) $state.go('login');
    if(navigator && navigator.splashscreen) navigator.splashscreen.hide();
    });

  });
  
  // Called to navigate to the main app
  $scope.startApp = function() {
    window.localStorage.didTutorial = true;
    $state.go('login');
  };

  // Called each time the slide changes
  $scope.slideChanged = function(index) {
    $scope.slideIndex = index;
  };
})


// LOGIN CONTROLLER
// ------------------------------------------------- //
.controller('LoginCtrl', function($rootScope, $scope, $state, $ionicHistory, $ionicPopup, $ionicLoading, SA4Helper, CRM) {

  $scope.data = {}; 
  $scope.data.useDemoData = false; 
  $scope.loginData = CRM.getConfig(); //load login info  

  // Hide Splashscreen Gracefully - https://calendee.com/2015/03/03/polish-app-launch-with-cordova-splashscreen-plugin/
  $scope.$on('$ionicView.loaded', function() {
    ionic.Platform.ready( function() {
    if(navigator && navigator.splashscreen) navigator.splashscreen.hide();
    });
  });
  // Login & go to initial state - NEED TO REPLACE WITH REAL LOGIN
  $scope.doLogin = function() {
    //Get UserInfo from CRM
    $ionicLoading.show({});

    CRM.setConfig($scope.loginData);  //update based on any changes 
    //determine which config to load prod or demo
    $scope.loginData.CRMConfig = "https://sa4-apps-config.firebaseio.com/OnGolf-" + ($scope.data.useDemoData ? "Demo" : "Prod"); 
    CRM.setConfig($scope.loginData);  //update with changes 

    CRM.setCurrentCRM($scope.loginData.CRMConfig)
    .then(function(currentCRM){
      $scope.loginData = CRM.getConfig(); //get any changes to config 

      currentCRM.getItem(currentCRM.entities.userInfo,$scope.loginData.userName)
      .then(function(results){
        //update login data and save back to config 
        $scope.loginData.fullName = results.UserInfo.UserName; 
        $scope.loginData.email = results.UserInfo.Email; 
        $scope.loginData.phone = results.UserInfo.Mobile; 
        currentCRM.setConfig($scope.loginData);
        $rootScope.$broadcast('authorized');  
        $ionicLoading.hide();

        //Clear all of cache and history since this is a new user
        $ionicHistory.clearCache();   //TODO - Doesn't seem to be working in call cases 
        $ionicHistory.clearHistory(); 

        SA4Helper.changeState.contactsRefresh =  true; //Force refresh on login 
        SA4Helper.changeState.coursesRefresh =  true; //Force refresh on login 
        SA4Helper.changeState.calendarRefresh =  true; //Force refresh on login 
        SA4Helper.changeState.campaignsRefresh =  true; //Force refresh on login 
        SA4Helper.changeState.settingsRefresh =  true; //Force refresh on login 
        //If not error go to Contacts       
        $state.go('tab.contacts');
      },
      function(error){
         $scope.showFailedPopup(); 
         $ionicLoading.hide();
      })
    })
  };

   $scope.showFailedPopup = function() {
    //$scope.data = {}
    var failedPopup = $ionicPopup.show({
      template: '<h3>Login Failed</h3><h4>Your login failed, please try again</h4>',
      title: '<div class="circle blue"><i class="ion-alert"></i></div>',
      subTitle: '',
      scope: $scope,
      buttons: [
        { text: '<i class="ion-close"></i>',
          type: 'close-modal'
        },
      ]
    });
    failedPopup.then(function(res) {
      console.log('Login failed!', res);
    });
   };
})

//TABS Controller - used to get counts for main tab 
.controller('tabsCtrl', function($scope, $timeout, SA4Helper, currentCRM){
  $scope.data = {}; 

  SA4Helper.updateCounts(currentCRM); 

  //Counts are bound to tabs scope and can be updated at anytime by calling SA4Helper.updateCounts 
  $scope.data.counts = SA4Helper.counts; 

// If Electron App - apply badge counts for number of tasks outstanding
  if (typeof(process) != "undefined") {

    $scope.$watch('data.counts.numOfActivities', function(newValue, oldValue){

      if (newValue !== 0) {

        var remote = require('remote');
        var electronApp = remote.require('app');
        var badgeNumber = newValue;
        var badgeString = badgeNumber.toString();
          
        console.log('badge value ' + badgeString);

        electronApp.dock.setBadge(badgeString);
       }

      }, true);

    }

})


// CONTACTS CONTROLLERS
// ------------------------------------------------- //
.controller('ContactsCtrl', function($scope, $cordovaContacts, matchTypeFilter, SA4Helper, currentCRM) {
  //Initialize settings
  $scope.data = {};
  $scope.data.newContact = {
  }; 
  $scope.data.showCourseSelector = true;  //Show course selector 

  $scope.data.toDevice = false;

  //set Change State for contactDetail that is accessible from other controllers
  //Set true on first entry to allow onEnter function to do a refresh
  SA4Helper.changeState.contactsRefresh =  true; 


  //Load search functions - toggle, hide, toTop, filter, etc
  $scope.search = new SA4Helper.search('contacts');  

  $scope.changeSelect = function(select){
    $scope.search.activeButton = select;
    //apply filter and select new group 
    $scope.filteredContacts =  $scope.search.groupList($scope.data.contacts, 'Status', select, $scope.firstLetter); 
  }; 

 
  //Used to group List of contacts 
  $scope.firstLetter = function(el){
    return el.Name.substring(0,1).toUpperCase(); 
  }; 

  //TODO - Add error handling 
  // refresh data 
  $scope.doRefresh = function() {
    SA4Helper.showLoading(); 
    currentCRM.getList(currentCRM.entities.contacts)
    .then(function(results){
      $scope.data.contacts = results; 

      //Set initial list to all 
      //$scope.filterContacts = $scope.data.contacts; 
      $scope.changeSelect('All'); 

      //Get courses for new Contact select box 
      currentCRM.getList(currentCRM.entities.courses)
      .then(function(results){
        $scope.data.courses = results; 
      });
    })
    .finally(function(){
       SA4Helper.hideLoading($scope); 
       SA4Helper.updateCounts(currentCRM);  //update counts in the background
    })
  };

  //Action Sheets definition - text = button text, name = template and modal names
  var newContactActionSheet = [
    // ADD BACK ONCE FIXED
    // { text: 'Add Contact From Device', name: 'fromDeviceContact' },
    { text: 'Create New Contact', name: 'newContact'}
  ];

  //Create action sheet
  $scope.newContact = SA4Helper.actionSheet(newContactActionSheet,$scope); 

  // Access Device Contacts - Cordova Plugin
  //TODO - Move into SA$Helper Service 
  $scope.getContactsFromDevice = function() {
    $scope.phoneContacts = [];
    // $scope.showLoading(); 
    var options = {};
    options.multiple = true;
    $cordovaContacts.find(options).then(onSuccess, onError);
    //Return functions 
    function onSuccess(contacts) {
      for (var i = 0; i < contacts.length; i++) {
        var contact = contacts[i];
        $scope.phoneContacts.push(contact);
      }
      // $ionicLoading.hide();
    };
    function onError(contactError) {
       // $ionicLoading.hide();
        alert(contactError);
    };
  };


  $scope.saveContactDevice = function(newContact) {
    // TODO- Finish Mapping Values
    // console.log(newContact);

    var contact = JSON.stringify(newContact);
    var FirstName = $scope.data.newContact.FirstName;
    var LastName = $scope.data.newContact.LastName;
    var MobilePhone = $scope.data.newContact.Mobile;
    var Email = $scope.data.newContact.Email;

    // alert(contact);
        // Cordova Contact Properties
      $cordovaContacts.save({
        "displayName": FirstName + " " + LastName,
        "name": [{
           "formatted": FirstName + " " + LastName
        }],
        "phoneNumbers": [{
          "type": "mobile",
          "value": MobilePhone
        }],
         "emails": [{
          "type": "work",
          "value": Email
        }]

      }).then(function(result) {
          alert('Successfully Added contact to Device');
      }, function(error) {
        console.log(error);
      });
  }


  $scope.closeNewContact = function(action, newContact){
    var selectedCourse = null; 
    if(action == 'Save' && $scope.data.toDevice){
            // add contact to infor list & to Device
            // $scope.saveContact();
            console.log(newContact);
           $scope.saveContactDevice(newContact);   
    }
    else if (action == 'Save' && $scope.data.toDevice == false) {

      //Get ID from selected course
      $scope.data.newContact.Account = {}; 
      selectedCourse = _.findKey($scope.data.courses,'$key', $scope.data.selectedKey); 
      $scope.data.newContact.Account.$key = $scope.data.selectedKey;
      $scope.data.newContact.Address = $scope.data.courses[selectedCourse].Address; 
      $scope.data.newContact.Status = "Target"; 

      currentCRM.createItem(currentCRM.entities.contact, $scope.data.newContact)
      .then(function(results){
        SA4Helper.showSuccessAlert('Contact added'); 
        $scope.doRefresh(); 
      }); 
    }; 
      $scope.data.newContact = {}; 
      $scope.newContact.newContact.hide();
    }; 

  //Action functions related to buttons on views 
  $scope.remove = function(contact) {
    contact.Status = "Remove"; 
    currentCRM.updateItem(currentCRM.entities.contact, contact.$key, contact)
      .then(function(results){
        SA4Helper.showSuccessAlert('Contact Removed'); 
        $scope.doRefresh(); 
    }); 
  }; 

  // Cleanup the modals when we're done with them (i.e: state change)
  // Angular will broadcast a $destroy event just before tearing down a scope 
  // and removing the scope from its parent.
  $scope.$on('$destroy', function() {
    console.log('Destroying modals...');
    //destroy modals
    $scope.newContact.destroy(); 
  });

  $scope.$on('$ionicView.enter', function() {
    if(SA4Helper.changeState.contactsRefresh == true) {
      $scope.doRefresh(); 
      SA4Helper.changeState.contactsRefresh = false; 
    }; 
  });
    
})

// Contact Detail Controller
.controller('ContactDetailCtrl', function($scope, $stateParams, $ionicPopup, $timeout, $cordovaEmailComposer, $cordovaSms, $previousState, matchTypeFilter, SA4Helper, currentCRM) {
    // Shown Div
  $scope.shownContent = 'profile';
  $scope.data = {}; 
  $scope.data.contactId = $stateParams.contactId; 
  $scope.data.campaignId = $stateParams.campaignId; //will be null if parent was not a campaign
  $scope.data.newActivity = {};
  $scope.data.newNote = {}; 
  $scope.data.showContactSelecter = false;  //Do not show contact selector for activity or note

  SA4Helper.changeState.contactRefresh = true; 
  SA4Helper.changeState.contactsRefresh = false; 

  var prevState = $previousState.get() ? $previousState.get().state.name : "none"; 

  //Setup activity details ui-sref setting based on previousState that called contact details
  switch (prevState){
    case 'tab.contacts':
    default:
      $scope.data.activityuisref = "tab.contact-activity-detail({contactId: data.contact.$key, activityId: activity.$key})";
      $scope.data.historyuisref = "tab.contact-history-detail({contactId: data.contact.$key, historyId: historyItem.$key})";
      break; 
    case 'tab.course-detail': 
      $scope.data.activityuisref = "tab.course-contact-activity-detail({courseId: data.contact.Account.$key, contactId: data.contact.$key, activityId: activity.$key})";
      $scope.data.historyuisref = "tab.course-contact-history-detail({courseId: data.contact.Account.$key, contactId: data.contact.$key, historyId: historyItem.$key})";
      break;
    case 'tab.campaign-detail': 
      $scope.data.activityuisref = "tab.campaign-contact-activity-detail({campaignId: data.campaignId, contactId: data.contact.$key, activityId: activity.$key})";
      $scope.data.historyuisref = "tab.campaign-contact-history-detail({campaignId: data.campaignId, contactId: data.contact.$key, historyId: historyItem.$key})";
      break;
  };

   $scope.getActivityPickLists = function(){
    currentCRM.getList(currentCRM.entities.pickListItems,"To Do Category Codes")
    .then(function(results){
        $scope.data.toDoCategories = results; 
    }); 
    currentCRM.getList(currentCRM.entities.pickListItems,"To Do Regarding")
    .then(function(results){
        $scope.data.toDoRegarding = results; 
    }); 
  }

  $scope.getHistory = function(){
    currentCRM.getList(currentCRM.entities.historyForContact,$scope.data.contactId)
    .then(function(results){
      $scope.data.contact.history = results; 
    }); 
  }

  $scope.doRefresh = function() {
    SA4Helper.showLoading();  
    //Get Contact Details 
    currentCRM.getItem(currentCRM.entities.contact,$scope.data.contactId)
    .then(function(results){
      $scope.data.contact = results;  

      $scope.getHistory(); 

      if ($scope.data.contact.Address != null){
        //setup address variable for viewLocation button 
        $scope.address = $scope.data.contact.Address.Address1 + "+" + $scope.data.contact.Address.City + "+" + 
        $scope.data.contact.Address.State + "+" + $scope.data.contact.Address.PostalCode
      }; 

      $scope.getActivityPickLists(); 
      SA4Helper.updateCounts(currentCRM);  //udpated counts in the background 

      //Get Wizard setup for Contact Profiler and load pick lists
      $scope.data.wizards = currentCRM.wizards.contactProfile; 
      angular.forEach(currentCRM.wizards.contactProfile, function(wizard) {
        currentCRM.getList(currentCRM.entities.pickListItems,wizard.pickList)
        .then(function(results){
          wizard.pickListValues = results; 
          wizard.currentValue = $scope['data']['contact']['SA4ContactOnGolf'][wizard.field];
        })
      });
    })
    .finally(function(){
      SA4Helper.hideLoading($scope); 
    })
  };

  
  //Action Sheets definition - text = button text, name = template and modal names
  var updateContactActionSheet = [
  { text: 'Edit Profile', name: 'editContact' },
    { text: 'Update Profile', name: 'profileContact' }, 
    { text: 'Add Note', name: 'addNoteToContact' }, 
    { text: 'Schedule Activity', name: 'scheduleActivity' }, 
  ];

  //Each modal needs at least two functions - close modal and take action based on buttons 
  //functions for each action 

  //Create action sheet
  $scope.updateContact = SA4Helper.actionSheet(updateContactActionSheet,$scope); 

   $scope.closeEditContact = function(action){
    if(action == 'Save'){
      // $scope.saveProfileContact(); 
      SA4Helper.changeState.contactsRefresh = true; 
    }
    $scope.updateContact.editContact.hide(); 
  }; 

    $scope.saveEditContact = function() {
    //update conact profile with data changes 
    currentCRM.updateItem(currentCRM.entities.contact,$scope.data.contactId, $scope.data.contact)
    .then(function(results){
      $scope.data.contact = results;
      $scope.getHistory();
      $scope.updateContact.editContact.hide();  
    });
  }; 


  $scope.closeProfileContact = function(action){
    if(action == 'Save'){
      $scope.saveProfileContact(); 
      SA4Helper.changeState.contactsRefresh = true; 
    }
    $scope.updateContact.profileContact.hide(); 
  }; 

  //TODO - Look at moving to SA4Helper Service
  $scope.saveProfileContact = function() {
    //update conact profile with data changes 
    angular.forEach($scope.data.wizards, function(wizard) {
      $scope['data']['contact']['SA4ContactOnGolf'][wizard.field] = wizard.currentValue; 
    })
    if ($scope.data.contact.SA4ContactOnGolf.Profile > 2){
      $scope.data.contact.Status = "Prospect"; 
    }
    else {
      $scope.data.contact.Status = 'Qualify';
    }
      //Change to business rule after save back
    //update contact with profile changes
    currentCRM.updateItem(currentCRM.entities.contact,$scope.data.contactId, $scope.data.contact)
    .then(function(results){
      $scope.data.contact = results;
      $scope.getHistory(); 
    });
  }; 

  $scope.closeAddNoteToContact = function(action){
    if(action == 'Save'){
      $scope.saveNoteForContact(); 
      SA4Helper.changeState.contactsRefresh = true; 
    }
    $scope.updateContact.addNoteToContact.hide(); 
  }; 

  //TODO - Look at moving to SA4Helper Service
  $scope.saveNoteForContact = function() {
    //update contact with new Note 
    $scope.data.newNote.Type = "atNote"; 
    $scope.data.newNote.ContactId = $scope.data.contact.$key;
    $scope.data.newNote.Name = $scope.data.contact.Name; 
    $scope.data.newNote.AccountId = $scope.data.contact.Account.$key; 
    $scope.data.newNote.StartDate = new Date().toJSON(); 
    currentCRM.createItem(currentCRM.entities.history, $scope.data.newNote)
    .then(function(results){
      $scope.data.newNote = {};  //clear out form
      $scope.doRefresh(); //refresh so note is displayed
    });
  }; 

  $scope.closeScheduleActivity = function(action){
      if(action == 'Save'){
        $scope.saveScheduleActivity(); 
        SA4Helper.changeState.contactsRefresh = true; 
      }
      $scope.updateContact.scheduleActivity.hide(); 
  }; 

  //TODO - Look at moving to SA4Helper Service
  $scope.saveScheduleActivity = function() {
    //update contact with new Note 
    $scope.data.newActivity.Type = "atToDo"; 
    $scope.data.newActivity.ContactId = $scope.data.contact.$key;
    $scope.data.newActivity.AccountId = $scope.data.contact.Account.$key; 
    currentCRM.createItem(currentCRM.entities.activity,$scope.data.newActivity)
    .then(function(results){
      $scope.data.newActivity = {};  //clear form on new activity
      $scope.doRefresh(); //Refresh so new activity is displayed
      SA4Helper.changeState.calendarRefresh = true;  
    });
  }; 



  // Cleanup the modals when we're done with them (i.e: state change)
  // Angular will broadcast a $destroy event just before tearing down a scope 
  // and removing the scope from its parent.
  $scope.$on('$destroy', function() {
    console.log('Destroying modals...');
    $scope.updateContact.destroy();
  });
    
  // CONTACT ACTIONS - Leverages Plugins

  // CALL CONTACT
  // Open Dialer Directly rather than having to confirm - uses in app brower plugin
  $scope.dialNumber = function(number) {
    
    // Electron app
    if (typeof(process) != "undefined") {
      var shell = require('shell');
      shell.openExternal('tel:' + number);
    }
    // Cordova or Web
    else {
      window.open('tel:' + number, '_system');
    }
    // $timeout(showCallPopup, 3000);
    $timeout( function(){ $scope.showCallPopup(); }, 2000);
    // $scope.showCallPopup(); //trigger popup after call - NEED TO WORK ON TIMING
  };

  // VIEW LOCATION ON MAP
 $scope.viewLocation = function() {
  var googleMapsUrl = "http://googlemaps.com?"; 
  // ios app
  if (ionic.Platform.isIOS()) {
    googleMapsUrl = "comgooglemaps-x-callback://?x-success=sourceapp://?resume=true&x-source=OnGolf&"; 
    window.open(googleMapsUrl + "q=" + $scope.address) ;
  }
  // electron app
  else if (typeof(process) != "undefined") {
    var shell = require('shell');
    shell.openExternal(googleMapsUrl + "q=" + $scope.address);
  }
  // web / other
  else {
     window.open(googleMapsUrl + "q=" + $scope.address) ;
  }
  // need to change to dynamic links
  //window.open('comgooglemaps-x-callback://?q=dessert&center=37.759748,-122.427135&','_system', 'location=no');
  
  };

  // SEND EMAIL - Cordova Email Composer
  $scope.sendEmail = function(email) {

if (ionic.Platform.isIOS()) {
 
     $cordovaEmailComposer.isAvailable().then(function() {
    // is available

        $cordovaEmailComposer.open(
      // Email Template
      { to: email,
        isHtml: true
          }).then(null, function () {
          // user cancelled email
        });
       }, function () {
       // not available
       alert('Email Not Available')
     });

      $timeout( function(){ $scope.showEmailPopup(); }, 2000);
      // $scope.showEmail
      // // $scope.showEmailPopup();//trigger popup - NEED TO WORK ON TIMING
  }

  // electron app
  else if (typeof(process) != "undefined") {
    var shell = require('shell');
    shell.openExternal("mailto:" + email);
  }
  else
  {
      // need to change to dynamic links
  window.open("mailto:" + email);
    
  }

   
  }

  // SEND TEXT
  // SMS Options for Android
  var options = {
              replaceLineBreaks: false, // true to replace \n by a new line, false by default
              android: {
                  intent: 'INTENT'  // send SMS with the native android SMS messaging
                  //intent: '' // send SMS without open any other app
              }
          };

    $scope.sendText = function(number) {

  if (ionic.Platform.isIOS()) {

       $cordovaSms.send(number, '', options)
          .then(function() {
            // Success! SMS was sent
          }, function(error) {
            // An error occurred
        });

    }
    // check for electron app
    else if (typeof(process) != "undefined") {
       var shell = require('shell');
     shell.openExternal("imessage:" + number);
    }
    else {

        // need to change to dynamic links
        window.open("sms:/" + number);

    }
   
  }

    // POPUPS
    // Call Pop UP
    $scope.showCallPopup = function() {
    //$scope.data = {}
    var callPopup = $ionicPopup.show({
      template: '<h3>Call Completed</h3><h4>What would you like to do next?</h4>',
      title: '<div class="circle blue"><i class="ion-ios-telephone"></i></div>',
      subTitle: '',
      scope: $scope,
      buttons: [
        { text: '<i class="ion-close"></i>',
          type: 'close-modal', },
        { text: '+ Add a note',
          onTap: function(a) {
           $scope.updateContact.addNoteToContact.show();
         }
        },
        { text: '+ Schedule an activity',
          onTap: function(b) {
           $scope.updateContact.scheduleActivityForContact.show();
         }
        },
        { text: '+ Nothing at this time',
          onTap: function(b) {
           callPopup.close();
         }
        }
      ]
    });
    callPopup.then(function(res) {
      console.log('Tapped!', res);
    });
   };

    // Email Pop UP
    $scope.showEmailPopup = function() {
    var emailPopup = $ionicPopup.show({
      template: '<h3>Email Sent</h3><h4>What would you like to do next?</h4>',
      title: '<div class="circle blue"><i class="ion-ios-email"></i></div>',
      subTitle: '',
      scope: $scope,
      buttons: [
        { text: '<i class="ion-close"></i>',
          type: 'close-modal', },
        { text: '+ Add a note',
          onTap: function(a) {
           $scope.updateContact.addNoteToContact.show();
         }
        },
        { text: '+ Schedule an activity',
          onTap: function(b) {
           $scope.updateContact.scheduleActivityForContact.show();
         }
        },
        { text: '+ Nothing at this time',
          onTap: function(b) {
           emailPopup.close();
         }
        }
      ]
    });
    emailPopup.then(function(res) {
      console.log('Tapped!', res);
    });
   };  

   $scope.$on('$ionicView.enter', function() {
    if(SA4Helper.changeState.contactRefresh == true) {
      $scope.doRefresh(); 
      SA4Helper.changeState.contactRefresh = false; 
    }; 
  });   
})

// Activity Controller
.controller('ActivityDetailCtrl', function($scope, $state, $stateParams, $previousState, $ionicHistory, SA4Helper, currentCRM) {
  
  $scope.data = {}; 
  $scope.data.activityId = $stateParams.activityId; 

    $scope.doRefresh = function() {
      SA4Helper.showLoading(); 
      currentCRM.getItem(currentCRM.entities.activity,$scope.data.activityId)
      .then(function(results){
        $scope.data.activity = results;   
      })
      .finally(function(){
        SA4Helper.hideLoading($scope); 
      })
    };

    //TODO - move into SA4Helper so it can be used in multiple places 
    $scope.completeActivity = function(){
      var activity = {
        "$name":"ActivityComplete",
        "request": {
          "entity": {"$key":  $scope.data.activityId },
          "ActivityId": $scope.data.activityId,
          "userId":currentCRM.getCurrentUser(),
          "result":"Complete",
          "resultCode":"COM",
          "completeDate": new Date()
        }
      }; 

      return currentCRM.createItem(currentCRM.entities.completeActivity, activity)
      .then(function(results){
        SA4Helper.showSuccessAlert('Activity Completed');
        SA4Helper.changeState.contactRefresh = true; 
        $ionicHistory.goBack(); 


      })
    };

    $scope.goBack = function(){
      $ionicHistory.goBack(); 
    }

    //Refresh on first pass 
     $scope.doRefresh();

})

// Activity Controller
.controller('HistoryDetailCtrl', function($scope, $state, $stateParams, $previousState, $ionicHistory, SA4Helper, currentCRM) {
  
  $scope.data = {}; 
  $scope.data.historyId = $stateParams.historyId; 

    $scope.doRefresh = function() {
      SA4Helper.showLoading(); 
      currentCRM.getItem(currentCRM.entities.history,$scope.data.historyId)
      .then(function(results){
        $scope.data.history = results;   
      })
      .finally(function(){
        SA4Helper.hideLoading($scope);
      })
    };

    $scope.goBack = function(){
      $ionicHistory.goBack(); 
    }
    
    //Refresh on first pass 
     $scope.doRefresh();

})


// COURSES CONTROLLERS
// ------------------------------------------------- //

.controller('CoursesCtrl', function($scope, matchTypeFilter, SA4Helper, currentCRM) {
  $scope.data = {};
  $scope.data.newCourse = {
  }; 

  $scope.search = new SA4Helper.search('courses'); 

  //set change state for courses and contacts to false on first entry - checked on entry to see if a refresh is needed. 
  SA4Helper.changeState.coursesRefresh= true;

  $scope.changeSelect = function(select){
    $scope.search.activeButton = select;
    //apply filter
    $scope.filteredCourses = $scope.search.groupList($scope.data.courses, 'Status', select, $scope.firstLetter);
  }; 

  //Used to group List of contacts 
  $scope.firstLetter = function(el){
    return el.Course.substring(0,1).toUpperCase(); 
  }; 


  $scope.doRefresh = function() {
    SA4Helper.showLoading(); 
    currentCRM.getList(currentCRM.entities.courses)
    .then(function(results){
      $scope.data.courses = results; 
      $scope.changeSelect('All'); 
      //get courseType PickList 
      currentCRM.getList(currentCRM.entities.pickListItems,"Account Golf Course")
      .then(function(results){
        $scope.data.courseTypes = results; 
      })
    })
    .finally(function(){
      SA4Helper.hideLoading($scope); 
    })
  };

 
  $scope.remove = function(course) {
    course.Type = "Remove - Golf Course"; 
    currentCRM.updateItem(currentCRM.entities.course, course.$key, course)
      .then(function(results){
        SA4Helper.showSuccessAlert('Course Removed'); 
        $scope.doRefresh(); 
    }); 

  }

  //Action Sheets definition - text = button text, name = template and modal names
  var newCourseActionSheet = [
    { text: 'Create New Course', name: 'newCourse'}
  ];

  //Create action sheet
  $scope.newCourse = SA4Helper.actionSheet(newCourseActionSheet,$scope); 

   $scope.closeNewCourse = function(action){
    if(action == 'Save'){
      $scope.saveCourse(); 
    }
    $scope.newCourse.newCourse.hide(); 
  }; 

   //Save Course
  $scope.saveCourse = function() {
    $scope.data.newCourse.Status = 'Target'; 
    $scope.data.newCourse.Type = 'Golf Course';

    currentCRM.createItem(currentCRM.entities.course, $scope.data.newCourse)
      .then(function(results){
        //Clear out data now that form data has been saved
        $scope.data.newCourse = {}; 
        SA4Helper.showSuccessAlert('New Course Created'); 
        $scope.doRefresh();  //refresh so new course is displayed 
    }); 
    
  };

  // Cleanup the modals when we're done with them (i.e: state change)
  // Angular will broadcast a $destroy event just before tearing down a scope 
  // and removing the scope from its parent.
  $scope.$on('$destroy', function() {
    console.log('Destroying modals...');
    $scope.newCourse.destroy(); 
  });

   $scope.$on('$ionicView.enter', function() {
    if(SA4Helper.changeState.coursesRefresh == true) {
      $scope.doRefresh(); 
      SA4Helper.changeState.coursesRefresh = false; 
    }; 
  });
})

.controller('CourseDetailCtrl', function($scope, $stateParams, SA4Helper, currentCRM) {
  // Shown Div
  $scope.shownContent = 'profile';
  $scope.data = {}; 
  //added to allow for course with no opportunities 
  $scope.data.opportunity = {
    Stage: null,
    CloseProbability: null,
    Account: {},
    AccountManager: {},
    Owner: {}
  }; 
  $scope.data.newContact = {
    Account: {}, 
    Address: {}, 
    AccountManager: {}, 
    Owner: {}
  }; 

  $scope.data.showContactSelector = true;  //show selector on schedule activity modal

  $scope.data.newActivity = {}; 


  $scope.data.courseId = $stateParams.courseId; 

  //Track Refresh states - shared with other controllers 
  SA4Helper.changeState.courseRefresh = true; 
  SA4Helper.changeState.coursesRefresh = false; 


  $scope.getContacts = function(){ 
    $scope.data.contacts = $scope.data.course.Contacts.$resources; 
  }; 

  $scope.getActivities = function(){ 
     //Get ativities with query based on course ID 
      return currentCRM.getList(currentCRM.entities.activitiesForCourse, $scope.data.courseId)
      .then(function(results){
        return $scope.data.activities = results; 
      })
    };


   $scope.getOpportunity = function(){ 
      //Update with opp if it exsists
      if($scope.data.course.Opportunities.$resources.length > 0) {
        $scope.data.opportunity = $scope.data.course.Opportunities.$resources[0]
      }
  }; 

   $scope.getHistory = function() {
    currentCRM.getList(currentCRM.entities.historyForAccount,$scope.data.courseId)
      .then(function(results){
        $scope.data.course.history = results; 
      });
    };  

  $scope.getWizards = function(){
    //Get Wizard setup for Contact Profiler 
    $scope.data.wizards = currentCRM.wizards.accountProfile;
    //Read in pick list value  
    angular.forEach(currentCRM.wizards.accountProfile, function(wizard) {
      currentCRM.getList(currentCRM.entities.pickListItems,wizard.pickList)
      .then(function(results){
        wizard.pickListValues = results; 
        wizard.currentValue = $scope['data']['course']['SA4AccountOnGolf'][wizard.field];
      })
    });

    $scope.data.wizardsStage = currentCRM.wizards.opportunityStage;
    //Read in pick list value  
    angular.forEach(currentCRM.wizards.opportunityStage, function(wizard) {
      currentCRM.getList(currentCRM.entities.pickListItems,wizard.pickList)
      .then(function(results){
        wizard.pickListValues = results; 
        wizard.currentValue = $scope['data']['opportunity'][wizard.field] || null;
      })
    });
  }; 

  $scope.getActivityPickLists = function(){
    currentCRM.getList(currentCRM.entities.pickListItems,"To Do Category Codes")
    .then(function(results){
        $scope.data.toDoCategories = results; 
    }); 
    currentCRM.getList(currentCRM.entities.pickListItems,"To Do Regarding")
    .then(function(results){
        $scope.data.toDoRegarding = results; 
    }); 
  };


  $scope.doRefresh = function() {
    SA4Helper.showLoading(); 
    currentCRM.getItem(currentCRM.entities.course,$scope.data.courseId)
    .then(function(results){
      $scope.data.course = results;
      $scope.data.showCourseSelector = false; //Don't show course selector on newContact
      //get related items 
      $scope.getOpportunity(); 
      $scope.getContacts(); 
      $scope.getActivities(); 
      $scope.getHistory(); 
      $scope.getWizards(); 
       $scope.getActivityPickLists();  //TODO - Move into service  
    })
    .finally(function(){
       SA4Helper.hideLoading($scope); 
    })
  };

  //Action Sheets definition - text = button text, name = template and modal names
  var updateCourseActionSheet = [
    { text: 'Profile Course', name: 'profileCourse' },
    { text: 'Update Stage', name: 'opportunityStage' },
    { text: 'Create Contact', name: 'newContact' },
     { text: 'Schedule Activity', name: 'scheduleActivity' }
  ];

  //Create action sheet
  $scope.updateCourse = SA4Helper.actionSheet(updateCourseActionSheet,$scope); 


  $scope.closeProfileCourse = function(action){
    if(action == 'Save'){
      $scope.saveProfileCourse(); 
      SA4Helper.changeState.coursesRefresh = true; 
    }
    $scope.updateCourse.profileCourse.hide(); 
  }; 

   $scope.saveProfileCourse = function() {
    angular.forEach($scope.data.wizards, function(wizard) {
        $scope['data']['course']['SA4AccountOnGolf'][wizard.field] = wizard.currentValue;
    });
    $scope.data.course.Status = 'Qualify';  //Change to business rule after save back 
    //update contact with profile changes
    currentCRM.updateItem(currentCRM.entities.course,$scope.data.courseId, $scope.data.course)
    .then(function(results){
      $scope.data.course = results; 
    });
    //Set flag that course detail has changed to so other views can refresh if needed 
    SA4Helper.changeState.coursesRefresh = true;   
  }; 

   $scope.closeOpportunityStage = function(action){
    if(action == 'Save'){
      $scope.saveOpportunityStage(); 
      SA4Helper.changeState.coursesRefresh = true; 
    }
    $scope.updateCourse.opportunityStage.hide(); 
  }; 

  $scope.saveOpportunityStage = function() {
    //update conact profile with data changes 
    angular.forEach($scope.data.wizardsStage, function(wizard) {
      $scope['data']['opportunity'][wizard.field] = wizard.currentValue; 
    })

    $scope.data.opportunity.CloseProbability = $scope.data.opportunity.Stage.match(/\((.*)\%/).pop();  //get number in state eg (10%) 
        
    //check for $key - update if present, create if not 
    if($scope.data.opportunity.$key != null ){
       currentCRM.updateItem(currentCRM.entities.updateOpportunity,$scope.data.opportunity.$key, $scope.data.opportunity)
       .then(function(results){
          $scope.data.opportunity = results; 
        });
    }
    else {
        $scope.data.opportunity.Description = $scope.data.course.Course + '- Initial Sale'; 
        $scope.data.opportunity.Type = 'New';
        $scope.data.opportunity.SalesPotential = 3500; 
         
        $scope.data.opportunity.Account.$key = $scope.data.courseId; 
        $scope.data.opportunity.Owner.$key = $scope.data.course.Owner.$key; 
        $scope.data.opportunity.AccountManager.$key  = $scope.data.course.AccountManager.$key;  
        currentCRM.createItem(currentCRM.entities.updateOpportunity, $scope.data.opportunity)
        .then(function(results){
          $scope.data.opportunity = results; 
        });
    }
    //Set flag that contact detail has changed to so other views can refresh if needed 
    SA4Helper.changeState.coursesRefresh = true;   
  }; 

  $scope.closeNewContact = function(action){
    if(action == 'Save'){
      $scope.saveNewContact(); 
      SA4Helper.changeState.coursesRefresh = true; 
    }
    $scope.updateCourse.newContact.hide(); 
  }; 

  $scope.saveNewContact = function() {
    $scope.data.newContact.Status = "Target"; 
    $scope.data.newContact.Account.$key = $scope.data.courseId || ""; 
    $scope.data.newContact.AccountManager.$key = $scope.data.course.AccountManager.$key || ""; 
    $scope.data.newContact.Owner.$key = "SYST00000001";  //Set owner to everyone 
    $scope.data.newContact.Address = {
      Address1: $scope.data.course.Address.Address1, 
      Address2: $scope.data.course.Address.Address2,
      City: $scope.data.course.Address.City,
      Country: null, 
      Description: "Work", 
      EntityId: null, 
      IsMailing: true, 
      IsPrimary: true, 
      PostalCode: $scope.data.course.Address.PostalCode,
      Salutation: "",
      State: $scope.data.course.Address.State    
    }; 
    currentCRM.createItem(currentCRM.entities.contact, $scope.data.newContact)
      .then(function(results){
        $scope.data.newContact = results; 
        SA4Helper.showSuccessAlert('New Contact Created'); 
        $scope.doRefresh(); //refresh contacts 
    });
  }; 

  //TODO - put in service to allow re-use
  $scope.closeScheduleActivity = function(action){
      if(action == 'Save'){
        $scope.saveScheduleActivity(); 
        SA4Helper.changeState.courseRefresh = true; 
      }
      $scope.data.newActivity = {}; //clear out form 
      $scope.updateCourse.scheduleActivity.hide(); 
  }; 

  //TODO - Look at moving to SA4Helper Service
  $scope.saveScheduleActivity = function() {
    //update contact with new Note 
    $scope.data.newActivity.Type = "atToDo"; 
    
    $scope.data.newActivity.ContactId = $scope.data.selectedKey;
    $scope.data.newActivity.AccountId = $scope.data.courseId; 
    currentCRM.createItem(currentCRM.entities.activity,$scope.data.newActivity)
    .then(function(results){
      $scope.data.newActivity = {};  //clear activity on successful save
      $scope.doRefresh(); 
      SA4Helper.changeState.calendarRefresh = true; 
    });
  }; 

  $scope.$on('$destroy', function() {
    console.log('Destroying modals...');
    //destroy modals
    $scope.updateCourse.destroy(); 
  });

  $scope.$on('$ionicView.enter', function() {
    if(SA4Helper.changeState.courseRefresh == true) {
      $scope.doRefresh(); 
      SA4Helper.changeState.courseRefresh = false; 
    }; 
  });
})


// Calendar CONTROLLERS
// ------------------------------------------------- //
.controller('CalendarCtrl', function($scope, $stateParams, $ionicSlideBoxDelegate, $timeout, $ionicModal, $cordovaLocalNotification, SA4Helper, currentCRM) {
  $scope.data = {};
  $scope.data.activities = {}; 
  $scope.data.newTask = {}; 
  $scope.data.newActivity = {}; 
  $scope.selectedKey = {}; 
  $scope.data.showContactSelector = true;  //show contact selector 

  //set initial date select to start of today
  $scope.dateSelected = moment().startOf('day');

  // Set Initial Active Slide - "Today"
  $scope.activeSlide = 2;  //replace hard value with today 


  //set Change State for Calender that is accessible from other controllers
  //Set true on first entry to allow onEnter function to do a refresh
  SA4Helper.changeState.calendarRefresh =  true; 

  //date fields 
  $scope.before = moment().subtract(2, 'd').startOf('Day'); 
  $scope.yesterday = moment().subtract(1, 'd').startOf('Day');
  $scope.today = moment().startOf('Day');
  $scope.tomorrow = moment().add(1, 'd').startOf('Day');
  $scope.after = moment().add(2, 'd').startOf('Day');

  $scope.getActivityPickLists = function(){
    currentCRM.getList(currentCRM.entities.pickListItems,"To Do Category Codes")
    .then(function(results){
        $scope.data.toDoCategories = results; 
    }); 
    currentCRM.getList(currentCRM.entities.pickListItems,"To Do Regarding")
    .then(function(results){
        $scope.data.toDoRegarding = results; 
    }); 
  };



  $scope.doRefresh = function() {
    SA4Helper.showLoading(); 
    currentCRM.getList(currentCRM.entities.activities,currentCRM.getCurrentUser())
    .then(function(results){
      $scope.data.activities = results;

      currentCRM.getList(currentCRM.entities.contacts)
      .then(function(results){
        $scope.data.contacts = results;   //only used for related to select.  Not stored as data.contacts to get around select box issue
      })

      $scope.getActivityPickLists();
      SA4Helper.updateCounts(currentCRM);  //Update Counts 

      //$scope.data.activities = resources.data.$resources;   
      $scope.$parent.data.numOfActivities = $scope.data.activities.length;  //Not bound correctly to parent view tabs 

      if (typeof(process) != "undefined") {
        var app = require('app');
        app.dock.setBadge($scope.data.activities.length);
      }


    })
    .finally(function(){
     SA4Helper.hideLoading($scope); 
    })
  };

    //TODO - move into SA4Helper so it can be used in multiple places 
    $scope.completeActivity = function(activityId){
      var activity = {
        "$name":"ActivityComplete",
        "request": {
          "entity": {"$key":  activityId },
          "ActivityId": activityId,
          "userId":currentCRM.getCurrentUser(),
          "result":"Complete",
          "resultCode":"COM",
          "completeDate": new Date()
        }
      }; 

      return currentCRM.createItem(currentCRM.entities.completeActivity, activity)
      .then(function(results){
        //$scope.completedActivity = results;  
        $scope.doRefresh(); 
      })
    };

 var newActivityActionSheet = [
    { text: 'Schedule Activity', name: 'scheduleActivity' },
  ];

  $scope.newActivity = SA4Helper.actionSheet(newActivityActionSheet, $scope); 

  //TODO - put in service to allow re-use
  $scope.closeScheduleActivity = function(action){
      if(action == 'Save'){
        $scope.saveScheduleActivity(); 
        SA4Helper.changeState.calendarRefresh = true; 
      }
      $scope.data.newActivity = {}; //clear out form 
      $scope.newActivity.scheduleActivity.hide(); 
  }; 

  //TODO - Look at moving to SA4Helper Service
  $scope.saveScheduleActivity = function() {
    //update contact with new activity 
    $scope.data.newActivity.Type = "atToDo"; 
    
    //Get Account and ContactId from related contact selected 
    var selectedContact = _.findKey($scope.data.contacts,'$key', $scope.data.selectedKey); 
    $scope.data.newActivity.ContactId = $scope.data.selectedKey;
    $scope.data.newActivity.AccountId = $scope.data.contacts[selectedContact].Account.$key; 
    currentCRM.createItem(currentCRM.entities.activity,$scope.data.newActivity)
    .then(function(results){
      $scope.data.newActivity = {};  //clear activity on successful save
      $scope.doRefresh(); 
    });
  }; 
    
  
  $scope.remove = function(task) {
    Tasks.remove(task);
  }

  // Tab Badge badgeCount - NEED TO DYNAMICALLY SET BASED ON NUMBER OF TASKS
  //TODO - remove after verified 
  //$scope.badgeCount = $scope.data.activities.length;

  $scope.slideHasChanged = function(index) {
    $scope.activeSlide = index;
  }

  //Calendar Navigation - Move to Active Slide via Subheader Buttons
  $scope.position = function(index) {
      //$ionicSlideBoxDelegate.slide(index);
      $scope.activeSlide = index;
  };

    // LOCAL NOTIFICATIONS - Alets User of a Task - NEED TO CLEANUP / REMOVE AS NEEDED
    // Set Notification to 1 Minute from Now
    $scope.addNotification = function() {
        var alarmTime = new Date();
        alarmTime.setMinutes(alarmTime.getMinutes() + 1);
        $cordovaLocalNotification.add({
            id: "1234",
            date: alarmTime,
            message: "This is a message",
            title: "This is a title",
            autoCancel: true,
            sound: null
        }).then(function () {
            console.log("The notification has been set");
        });
    };
    // Check if Notification is scheduled - True/False
    $scope.isScheduled = function() {
        $cordovaLocalNotification.isScheduled("1234").then(function(isScheduled) {
            alert("Notification 1234 Scheduled: " + isScheduled);
        });
    }

  // Cleanup the modals when we're done with them (i.e: state change)
  // Angular will broadcast a $destroy event just before tearing down a scope 
  // and removing the scope from its parent.
  $scope.$on('$destroy', function() {
    console.log('Destroying modals...');
    $scope.updateContact.destroy();
  });

  // SlideBox Issue - Need to Update on Enter to Ensure it Doesn't Disapear
  //Also does refresh on initial 
  $scope.$on('$ionicView.enter', function(){
    $ionicSlideBoxDelegate.update();
    if(SA4Helper.changeState.calendarRefresh == true) {
      $scope.doRefresh(); 
      SA4Helper.changeState.calendarRefresh = false; 
    }; 
  });


})

.controller('CalendarDetailCtrl', function($scope, $stateParams) {
  
    // $scope.task = Tasks.get($stateParams.taskId);
    // Need to Finish - Show Task Details
})

// CAMPAIGNS CONTROLLERS
// ------------------------------------------------- //

.controller('CampaignsCtrl', function($scope, SA4Helper, currentCRM) {
  $scope.data = {};
  $scope.data.campaigns = {}; 

  SA4Helper.changeState.campaignsRefresh = true; 

  $scope.search = new SA4Helper.search('campaigns');

   $scope.changeSelect = function(select){
    $scope.search.activeButton = select;
    //apply filter and select new group 
    $scope.filteredCampaigns =  $scope.search.groupList($scope.data.campaigns, 'Status', select, null); 
  }; 


  $scope.doRefresh = function() {
    SA4Helper.showLoading(); 

      //currentCRM.getList(currentCRM.entities.campaignSummaries)
      //.then(function(results){
      //$scope.data.campaigns = results; 
      //$scope.changeSelect('All');
      //})

      //changed to read directly from MailChimp   
      currentCRM.getMashup(currentCRM.mashups.config, currentCRM.mashups.campaigns)
      .then(function(results){
        $scope.data.campaigns = results.data.campaigns; 
        $scope.changeSelect('All');
      })
  

      
    .finally(function(){
      SA4Helper.hideLoading($scope);
    })
  };

   $scope.$on('$ionicView.enter', function() {
    if(SA4Helper.changeState.campaignsRefresh == true) {
      $scope.doRefresh(); 
      SA4Helper.changeState.campaignsRefresh = false; 
    }; 
  });
})

.controller('CampaignDetailCtrl', function($scope, $stateParams, $ionicScrollDelegate, SA4Helper, currentCRM) {
  $scope.data = {};
  $scope.data.campaign = {}; 
  $scope.data.campaignId = $stateParams.campaignId; 

  SA4Helper.changeState.campaignRefresh = true; 

  $scope.activityCount = function(activities, activityType) {
    _.countBy(activities, function(activity){
      return activity.action; 
    })
  };

  $scope.checkContactIdCondition = function(index) {
    //Need to refactor to get contactId for this selected response
    return ('#');

    /*
    return checkcondition()
        ? 'someState'
        : '-' // hack: must return a non-empty string to prevent JS console error
    */
  };

  $scope.doRefresh = function() {
    SA4Helper.showLoading(); 
    //Get campaign info

     //Need to refactor this format to avoid having to pass mashups back in to get config 
    currentCRM.getMashup(currentCRM.mashups.config, currentCRM.mashups.campaignSummary, $stateParams.campaignId)
    .then(function(results){
        $scope.data.campaign = results.data; 

        //Get targets 
         currentCRM.getMashup(currentCRM.mashups.config, currentCRM.mashups.campaignList, $scope.data.campaign.recipients.list_id)
        .then(function(results){
          $scope.data.campaign.contacts = results.data.members; 
        })
    })

    //get Follow-ups 
    currentCRM.getMashup(currentCRM.mashups.config, currentCRM.mashups.campaignResponses, $stateParams.campaignId)
    .then(function(results){
      $scope.data.campaign.responses = results.data; 

      //Get opens, clicks, and calculate score 
      angular.forEach($scope.data.campaign.responses.emails, function(response){
        response.actionCounts = _.countBy(response.activity, 'action'); 
        response.score = (response.actionCounts['open'] || 0) + (response.actionCounts['click'] || 0) * 3; 
      })
      SA4Helper.hideLoading($scope);
    })  

    //Get unsubscribes 
    currentCRM.getMashup(currentCRM.mashups.config, currentCRM.mashups.campaignUnsubscribes, $stateParams.campaignId)
    .then(function(results){
        $scope.data.campaign.unsubscribes = results.data.unsubscribes; 
    })

   

    /*
    .finally(function(){SA4Helper.hideLoading($scope);  
    })
    */
  

    /*
      //Now get targets async for this campaign 
      //TODO - Need to get these groups seperately as they are not in the contacts tree 
      currentCRM.getList(currentCRM.entities.campaignTargets, $stateParams.campaignId)
      .then(function(results){
        $scope.data.campaign.contacts = results; 
        //$scope.data.campaign.groups = _.pluck(_.uniq($scope.data.campaign.contacts, 'GroupName'),'GroupName');
        $scope.data.campaign.groups = _.countBy($scope.data.campaign.contacts, function(n){
          var groupName = n.CampaignTargets.$resources[0].GroupName
          return groupName == null || groupName.length <= 0 ? "No Group" : groupName  ;
        })
      })
    })
  */
    
  };

   // Resize Screen when switching 'tabs'
      $scope.resize = function() {
        $ionicScrollDelegate.resize();
        SA4Helper.updateCounts(currentCRM); 
    }

   $scope.$on('$ionicView.enter', function() {
    if(SA4Helper.changeState.campaignRefresh == true) {
      $scope.doRefresh(); 
      SA4Helper.changeState.campaignRefresh = false; 
    }; 
  });  

    // Shown Div
  $scope.shownContent = 'follow';
    
})


// SETTINGS CONTROLLERS
// ------------------------------------------------- //

.controller('SettingsCtrl', function($scope, $cordovaEmailComposer, SA4Helper, currentCRM, config) {

  $scope.version = '';
  SA4Helper.changeState.settingsRefresh = true; 


   if (typeof(process) != "undefined") {
      var remote = require('remote');
      var electronApp = remote.require('app');
      $scope.version = electronApp.getVersion();
    }
    else {
      $scope.version = config.VERSION;
    }
  

  $scope.doRefresh = function(){
    $scope.loginData = currentCRM.getConfig();   
  }; 
  
    // Send Email to Report App Issue
    $scope.reportIssue = function() {
         $cordovaEmailComposer.open(
          // Email Template
          { to: 'issues@smartapps4.com',
            subject: 'ISSUE - OnGolf Quick Profiler', 
            cc: 'jberry@smartapps4.com', //copy Jordan 
            isHtml: true
          }).then(null, function () {
        // user cancelled email
        });
      };

    $scope.$on('$ionicView.enter', function() {
      if(SA4Helper.changeState.settingsRefresh == true) {
        $scope.doRefresh(); 
        SA4Helper.changeState.settingsRefresh = false; 
      };
    });  
})


.controller('QuestionCtrl', function($scope, $timeout, Questions) {

    $scope.doRefresh = function() {
    
    console.log('Refreshing!');
    $timeout( function() {
      //Stop the ion-refresher from spinning
      $scope.$broadcast('scroll.refreshComplete');
    
    }, 1000);
      
  };

    // Service Calls - Get Questions
    $scope.questions = Questions.all();

})

.controller('QuestionDetailCtrl', function($scope, $timeout, $stateParams, Questions) {

 $scope.question = Questions.get($stateParams.questionId);

});
