angular.module('SA4.CRM', [])

.factory('CRM', function(InforCRM, $window, $http, $q, $firebaseObject){

  //Config Paramaters 
  var default_config = { 
      "userName": "admin",
      "password": "",
      "fullName": "Administrator",
      "email": "", 
      "CRM_Url": ""

  };

  var config = {};  //set to local store on entry 

  var CRM = {
    InforCRM: {
      getList: function(feed, limitValue) {
        return InforCRM.getFeed(getConfig(),feed, limitValue);
      },
      getListCount: function(feed,limitValue) {
        return InforCRM.getFeedCount(getConfig(),feed,limitValue)
      },
      getItem: function(feed,limitValue) {
        return InforCRM.getFeedItem(getConfig(),feed,limitValue);
      },
      updateItem: function(feed,limitValue, payLoad){
        return InforCRM.updateItem(getConfig(), feed, limitValue, payLoad);
      },
      createItem: function(feed, payLoad){
        return InforCRM.createItem(getConfig(), feed, payLoad);
      },
      getCurrentUser: function(){
        return getConfig().userName;
      },
      getReturnObj: function(obj, str) {
        return str.split(".").reduce(function(o, x) { return o[x] }, obj);
      },
      getConfig: function() {  
        return getConfig();
      },
      setConfig: function(userUpdate){
        return setConfig(userUpdate); 
        
        /* TODO not needed anymore - remove after verifying
        config.userName = userUpdate.userName; 
        config.password = userUpdate.password; 
        config.fullName = userUpdate.fullName;  
        config.email = userUpdate.email; 
        config.phone = userUpdate.phone; 
        config.useDemoData = userUpdate.useDemoData; 
        config.CRMConfig = userUpdate.CRMConfig; 
        return setConfig(config);
        */
      },
      entities: {
        feeds: {
          name: null,
          query: null, 
          select: null,
          fieldMap: null,
          format: "json"
        }
      }
    }
  };

  //read CRM info from firebase and update 
  var setCurrentCRM = function(CRMConfig){
    var ref = new Firebase(CRMConfig); 
    return $firebaseObject(ref).$loaded()
    .then(function(CRMData){
      overrideCRMData(CRMData);
      return getCRM(CRMData.config.CRM);  //return CRM Object 
    })
  }; 

  var overrideCRMData = function(CRMData) {
    //add overrides to CRM service object 
    //config items 

    //Load userName and password
    //config = getConfig();  //not needed anymore - remove once verified

    //override URL if provided 
    if(CRMData.config.Url){
      //Update local store config with new url 
      var currentConfig = getConfig(); 
      currentConfig.CRM_Url = CRMData.config.Url; 
      setConfig(currentConfig); 
    };

   //Get overrides for each entity  
   _.each(CRMData.entities, function(entityValue, entityKey) {
      _.each(CRMData.entities[entityKey], function(itemValue, itemKey){
        if(CRM[CRMData.config.CRM].entities[entityKey] == null){
          CRM[CRMData.config.CRM].entities[entityKey] = {}; 
        }
        CRM[CRMData.config.CRM].entities[entityKey][itemKey] = itemValue; 
      })
    });

   //Load Wizards 
   CRM[CRMData.config.CRM]['wizards'] = CRMData['wizards'];
  
  }; 

  var mapResult = function(input, map) {
    var output = []; 
    angular.forEach(input, function(item , key){
      var new_item = {}; 
      _.each(item, function(value, key) {
        key = map[key] || key;
        new_item[key] = value;
      });
      output.push(new_item);
    });
    return output; 
  }; 
   
  var getCRM = function(CRM_Name) {
    return CRM[CRM_Name];
  };


  //add config from local storage
  var setConfig = function(newConfig) {
      $window.localStorage['CRM_config'] = JSON.stringify(newConfig);
      //config = newConfig;
  };

  //Read config from local storage 
  var getConfig = function(){
    var localConfig = $window.localStorage['CRM_config']; 
    //set to defaul if not defined 
    if(typeof localConfig === 'undefined') {
      localConfig = JSON.stringify(default_config);
    };    
    return JSON.parse(localConfig);  
  };

  return {
    setCurrentCRM: setCurrentCRM,
    getCRM: getCRM,
    overrideCRMData: overrideCRMData,
    mapResults: mapResult,
    setConfig: setConfig,
    getConfig: getConfig
  }
})


.config(['$httpProvider', function($httpProvider) {  
    $httpProvider.interceptors.push('InforCRMInterceptor');
}])


.factory('InforCRMInterceptor', function($q, $location, $log) {  
return {
    /*
    request: function (config) {
        console.log(config);
        return config;
    },

    response: function (result) {
        console.log('Repos:');
        return result;
    },
    */
    
    responseError: function (rejection) {
        console.log('Failed with', rejection.status, 'status');

        alert("Request failed - please try the operation again and contact your adminstrator if it continues"); 

        return $q.reject(rejection);
    }
  }
})


//Smartapps4 - Infor CRM Service 
// 
// Uses config object that consists of the following objects
// userName 
// password
// SDATA_URL

.factory('InforCRM',  function ($http, $q, $window) {


    $http.defaults.useXDomain = true;
    //$http.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    //$http.defaults.headers.common['Authorization'] = 'Basic ' + btoa("admin" + ":" + "");
    $http.defaults.headers.common.withCredentials = true;

    //Helper function to build SData url string 
    var buildUrl = function(CRM_URL, feed, limitValue) {
      //Build type segment 
      var typeSegment = "";
 
      switch(feed.type) {
        case 'dynamic':
          typeSegment = "/slx/dynamic/-/";
          break;
        case 'system':
          typeSegment = "/slx/system/-/";
          break;
        default:
          typeSegment = "/slx/dynamic/-/";
      }

      var url = CRM_URL + 
        //select type of call 
        typeSegment +
        (feed.name != null ? feed.name : "") + 
        //add limitValue as predicate if limitValue included and queryLimit not included 
        (limitValue != null && feed.queryLimit == null ? "(" + 
          (feed.itemLimit != null ? feed.itemLimit : "") + "'" + limitValue + "')": "") +
        //add relationship if present 
        (feed.relationship != null ? "/" + feed.relationship : "") + 
        //add format type
        "?format=json" + 
        //Build query section and add limitValue if querlyLimit included
        (feed.query != null || feed.queryLimit != null ? "&where=" :"" ) + 
        (feed.query != null ?  feed.query : "") + 
        (feed.query != null && feed.queryLimit != null ? " and " : "") +
        (feed.queryLimit != null ? feed.queryLimit + " eq '" + limitValue + "'" : "") + 
        (feed.select != null ? "&select=" + feed.select : "") + 
        "&_t=" + Date.now(); 

        return url; 
    };

    
    var mapResult = function(input, map) {
      var output = []; 
      angular.forEach(input, function(item , key){
        var new_item = {}; 
        _.each(item, function(value, key) {
          key = map[key] || key;
          new_item[key] = value;
        });
        output.push(new_item);
      });
    return output; 
  }; 

    //Get all Dynamic Resources
    var getFeeds = function (config,feedConfig){

      return $http.get(
        buildUrl(config.CRM_Url, feedConfig, null, null) , 
        { headers: {'Authorization':  'Basic ' + btoa(config.userName + ":" + config.password) }}
      )  
    };

    //TODO - move transformation of keys to helper function 

    var getFeed = function(config,feedConfig,limitValue, queryLimitValue){

      return $http({
        method: 'GET', 
        transformResponse : function (data, headers) {
            if(feedConfig.fieldMap) {
              var data = data.replace(/\w+/g, function(m) {
            return feedConfig.fieldMap[m] || m;
            });
          }
          return JSON.parse(data);
        },
        url: buildUrl(config.CRM_Url, feedConfig, limitValue, queryLimitValue),
        headers: {
          'Authorization':  'Basic ' + btoa(config.userName + ":" + config.password)
        }
      })
      .then(function(results){
        return results.data.$resources
      })
    };

    var getFeedCount = function(config, feedConfig, limitValue, queryLimitValue){
      return $http({
        method: 'GET', 
        url: buildUrl(config.CRM_Url, feedConfig, limitValue, queryLimitValue),
        headers: {'Authorization':  'Basic ' + btoa(config.userName + ":" + config.password) }
      })
      .then(function(results){
        return results.data.$totalResults;
      })
    };

    var getFeedItem = function (config, feedConfig, limitValue, queryLimitValue){
      return $http({
        method: 'GET', 
        transformResponse : function (data, headers, status) {
          if(feedConfig.fieldMap && status <= 200) {
            var data = data.replace(/\w+/g, function(m) {
          return feedConfig.fieldMap[m] || m;
          });
        }
        return status <= 200 ? JSON.parse(data) : data;  //return data as is if error 
        },
        url: buildUrl(config.CRM_Url,feedConfig, limitValue, queryLimitValue),
        headers: {
          'Authorization':  'Basic ' + btoa(config.userName + ":" + config.password)
        },
      })
       .then(function(results){
        return results.data;
      });
    };

    var updateItem = function(config,feedConfig, limitValue, payLoad){
      return $http({
        method: 'PUT',
         transformResponse : function (data, headers) {
            if(feedConfig.fieldMap) {
              var data = data.replace(/\w+/g, function(m) {
            return feedConfig.fieldMap[m] || m;
            });
          }
          return JSON.parse(data);
        },
        url: buildUrl(config.CRM_Url,feedConfig, limitValue),
        headers: {
          'Authorization':  'Basic ' + btoa(config.userName + ":" + config.password) 
          //'If-Match': payLoad.$etag
        },
        data: JSON.stringify(payLoad)
      })
       .then(function(results){
          return results.data;
      });
    };


    var createItem = function(config,feedConfig, payLoad){
      return $http({
        method: 'POST',
         transformResponse : function (data, headers) {
            if(feedConfig.fieldMap) {
              var data = data.replace(/\w+/g, function(m) {
            return feedConfig.fieldMap[m] || m;
            });
          }
          return JSON.parse(data);
        },
        url: buildUrl(config.CRM_Url,feedConfig),
        headers: {
          'Authorization':  'Basic ' + btoa(config.userName + ":" + config.password) 
          //'If-Match': payLoad.$etag
        },
        data: JSON.stringify(payLoad)
      })
       .then(function(results){
        return results.data;
      })
    }; 

    //Entity Related Methods
    var getGroups = function (config,query){
      return $http.get(
        config.CRM_Url + "/slx/system/-/groups/?format=json" + 
         (query != null ? "&where=" + query : "") ,
        { headers: {'Authorization':  'Basic ' + btoa(config.userName + ":" + config.password) }}

      )  
    };

    var getGroup = function (config,groupId){
      return $http.get(
        config.CRM_Url + "/slx/system/-/groups/$queries/execute?format=json&_groupId=" + groupId,
        { headers: {'Authorization':  'Basic ' + btoa(config.userName + ":" + config.password) }}
      )
    };

    var getEntityDetails = function (config,entity, entityId, query){
      return $http.get(
        config.CRM_Url + "/slx/dynamic/-/" + entity + "('" + entityId + "')?format=json" + query,
        { headers: {'Authorization':  'Basic ' + btoa(config.userName + ":" + config.password) }}
      )
    };

    var getEntityHistory = function (config,entity, entityId){
      return $http.get(
          config.CRM_Url + "/slx/dynamic/-/history?format=json&where=" + entity  + " eq '" + entityId + "'",
          { headers: {'Authorization':  'Basic ' + btoa(config.userName + ":" + config.password) }}
        )  
    };

     var getEntityActivities = function (config,entity, entityId){
      return $http.get(
        CRM_Url + "/slx/dynamic/-/activities?format=json&where=" + entity  + " eq '" + entityId + "'",
        { headers: {'Authorization':  'Basic ' + btoa(config.userName + ":" + config.password) }}
      )  
    };

    return {
        getFeeds: getFeeds,
        getFeed: getFeed,
        getFeedCount: getFeedCount,
        getFeedItem: getFeedItem,
        getGroups: getGroups,
        getGroup: getGroup, 
        updateItem: updateItem,
        createItem: createItem, 
        getEntityDetails: getEntityDetails,
        getEntityHistory: getEntityHistory,
        getEntityActivities: getEntityActivities  
    }
})


.factory('Avatars',  function ($http, $q) {
  var allAvatars = {};

  //get all avatars 
  var getAllAvatars = function(){
      var deferred = $q.defer();

      $http.get(CRM_URL + "system/-/libraryDirectories(directoryName%20eq%20'Avatars')/documents?format=json")
      .then(function(avatars){
        allAvatars = avatars.data.$resources;
        angular.forEach(allAvatars, function(avatar){
          getAvatarImage(avatar)  //load the image for each attachment via a promise
          .then(function(response){
            avatar.imageURI = window.URL.createObjectURL(response.data);
          });
          deferred.resolve(allAvatars);
        }) 
      })
      .catch(function(error){
        deferred.rejected(error);
      })  
    return deferred.promise;
    };

    var getAvatarImage =  function(avatar) {
      var url = avatar.$url;
      //url = url.substring(0, url.indexOf('?'));
      //url = url.replace("dynamic", "system");  //quirk with sData when downloading blob info needs to be system
      // setup to get blob of image back
      return($http.get(url+ "/file", {responseType: "blob"}));
    };

    var getUserAvatar = function(User) {
      var file = User.trim().concat('.jpg');
      var avatar = _.find(allAvatars, { 'fileName' : file });
      return avatar.imageURI;
    };

    return {
      getAllAvatars: getAllAvatars,
      getUserAvatar: getUserAvatar
    }
})




