// OnGolf services
// Needs to be replaced with calls to CRM Core
// ------------------------------------------------- //

angular.module('onGolf.services', [])

.filter('moment', function() {
    return function(dateString, format) {
        return moment(dateString).format(format);
    };
})

//Filter used to filter arrays by Type 
.filter('matchType', function () {
  return function (items, field, value) {
    var filtered = [];
    angular.forEach(items, function(item) {
      if(value == 'All' || item[field] == value && item[field]) {
        filtered.push(item);
      }
    });
    return filtered;
  };
})

.factory('SA4Helper', function($ionicLoading,$ionicModal, $ionicActionSheet, $q, $ionicScrollDelegate,$ionicPopup,$timeout){
  
  //Search Helper - for toggle search and managing filters
  var search = function(searchName) {
    return searchName = {
      searchValue : '',
      filter : 'All',
      activeButton : 'All', 
      show : false, 
      toggle: function() {
          this.show = this.show === false ? true: false;
          this.searchValue = '';
      }, 
      hide: function() {
        this.showSearch = false;
        this.searchValue = '';
      },
      clear: function() {
        this.searchValue = '';
      }, 
      toTop: function() {
        $ionicScrollDelegate.scrollTop(true);
        console.log('Scrolled to top!')
      },
      //Used to group List of contacts 
      groupList: function(arrayToGroup, filterField, filterValue, groupFunction) {
        //Apply Filter if not All
        if(filterValue != 'All') {
          arrayToGroup = _.filter(arrayToGroup, filterField, filterValue); 
        }; 
        
        //Group array if GroupFunction exsist otherwise just return filtered array
        if(groupFunction){
          return  _.chain(arrayToGroup)
          .groupBy(groupFunction)
          .pairs()
          .sortBy(function(currentItem){
            return currentItem[0];
          })
          .value(); 
        }
        else {
          return arrayToGroup; 
        };
        
      } 
    };   
  };

  //Ionic Loading Helpers 
  var showLoading = function(){
    $ionicLoading.show({
      content: 'Loading',
      animation: 'fade-in',
      showBackdrop: true,
      maxWidth: 200,
      showDelay: 0
    });
  }; 

  var hideLoading = function($scope){
    $scope.$broadcast('scroll.refreshComplete')
    $ionicLoading.hide();
  }; 

  //Helper for Popup Alert
  // New Contact Created Alert
  var showSuccessAlert = function(alert) {
     var successAlert = $ionicPopup.alert({
      template: '<h3>Success!</h3><h4>' + alert + '</h4>',
      title: '<div class="circle blue"><i class="ion-checkmark"></i></div>',
      subTitle: '',
      buttons: [],
     });
     $timeout(function() {
       successAlert.close(); //close the popup after 1.4 seconds
    }, 1400);
  };

  //actionSheet helper that are injected into service after being built 
 
  
  //Action Sheet helper 
  var actionSheet = function(modalDefinition, $scope) {
    //used to store current modal index used for hide
    var currentModalIndex = ""; 
    var modals = {
      show: function(){
        $ionicActionSheet.show({
        buttons: modals.buttons,
        cancelText: 'Cancel',
      cancel: function() {
           console.log('Action Canceled');
          },
       buttonClicked: function(index) {
          //Show modal for this button 
          currentModalIndex = index; 
          modals[modals.buttons[index].name].show(); 
          return true; 
        }
      })
      },
      hide: function(){ 
        modals[modals.buttons[currentModalIndex].name].hide(); 
      }, 
      destroy: function(){
        //Use button names to find modal and remove it 
        angular.forEach(modals.buttons, function(button) {
          modals[button.name].remove();
        }) 
      }
    }; 
    //Create a modal for each button based on name with template modal-name 
    modals.buttons = modalDefinition; 
    angular.forEach(modalDefinition, function(item) {
      $ionicModal.fromTemplateUrl('templates/modal-' + item.name + '.html', {
        id: item.name,
        scope: $scope,
        animation: 'slide-in-up'
      })
      .then(function(modal) {
        modals[item.name] = modal;
      });
    });
    return modals; 
  }; 

  //counts used for summary info  
  var counts = {
    numOfActivities : 0,  
    numOfResponses : 0
  }

  var updateCounts = function(currentCRM) {
    var deferred = $q.defer(); 

    currentCRM.getListCount(currentCRM.entities.activityCount, currentCRM.getCurrentUser())
    .then(function(results){
        counts.numOfActivities = results;
        //deferred.resolve(counts.numOfActivities);     
    })
    currentCRM.getList(currentCRM.entities.campaignSummaries)
    .then(function(results){ 

      counts.numOfResponses = _.sum(results, 'Responses'); 

      /* 
      counts.numOfResponses = _.reduce(results, function(sum, el){
        if (el.SA4CampaignSummary.Responses == null) {
          el.SA4CampaignSummary.Responses = 0; 
        }; 
        return sum + el.SA4CampaignSummary.Responses; 
        },0); 
        //deferred.resolve(counts.numOfResponses); 
      }) 
      */
  })
    return deferred.promise;  
  } 

  

  //change state object used to share change status between controllers 
  var changeState = {
    contactChanged: false, 
    accountChanged: false
  }; 
  

  return {
    search: search, 
    showLoading: showLoading,
    hideLoading: hideLoading, 
    changeState: changeState,
    showSuccessAlert: showSuccessAlert,
    actionSheet: actionSheet,
    updateCounts: updateCounts, 
    counts: counts
  }
})

