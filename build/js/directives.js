// Directives Used Throughout Application
angular.module('onGolf.directives', [])
    

 .directive('ionAffix', ['$ionicPosition', function ($ionicPosition) {

        // keeping the Ionic specific stuff separated so that they can be changed and used within an other context

        // see https://api.jquery.com/closest/ and http://ionicframework.com/docs/api/utility/ionic.DomUtil/
        function getParentWithClass(elementSelector, parentClass) {
            return angular.element(ionic.DomUtil.getParentWithClass(elementSelector[0], parentClass));
        }

        // see http://underscorejs.org/#throttle
        function throttle(theFunction) {
            return ionic.Utils.throttle(theFunction);
        }

        // see http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
        // see http://ionicframework.com/docs/api/utility/ionic.DomUtil/
        function requestAnimationFrame(callback) {
            return ionic.requestAnimationFrame(callback);
        }

        // see https://api.jquery.com/offset/
        // see http://ionicframework.com/docs/api/service/$ionicPosition/
        function offset(elementSelector) {
            return $ionicPosition.offset(elementSelector);
        }

        // see https://api.jquery.com/position/
        // see http://ionicframework.com/docs/api/service/$ionicPosition/
        function position(elementSelector){
            return $ionicPosition.position(elementSelector);
        }

        function applyTransform(element, transformString) {
            // do not apply the transformation if it is already applied
            if (element.style[ionic.CSS.TRANSFORM] == transformString) {
            }
            else {
                element.style[ionic.CSS.TRANSFORM] = transformString;
            }
        }

        function translateUp(element, dy, executeImmediately) {
            var translateDyPixelsUp = dy == 0 ? 'translate3d(0px, 0px, 0px)' : 'translate3d(0px, -' + dy + 'px, 0px)';
            // if immediate execution is requested, then just execute immediately
            // if not, execute in the animation frame.
            if (executeImmediately) {
                applyTransform(element, translateDyPixelsUp);
            }
            else {
                // see http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
                // see http://ionicframework.com/docs/api/utility/ionic.DomUtil/
                requestAnimationFrame(function () {
                    applyTransform(element, translateDyPixelsUp);
                });
            }
        }

        var CALCULATION_THROTTLE_MS = 500;

        return {
            // only allow adding this directive to elements as an attribute
            restrict: 'A',
            // we need $ionicScroll for adding the clone of affix element to the scroll container
            // $ionicScroll.element gives us that
            require: '^$ionicScroll',
            link: function ($scope, $element, $attr, $ionicScroll) {
                // get the affix's container. element will be affix for that container.
                // affix's container will be matched by "affix-within-parent-with-class" attribute.
                // if it is not provided, parent element will be assumed as the container
                var $container;
                if ($attr.affixWithinParentWithClass) {
                    $container = getParentWithClass($element, $attr.affixWithinParentWithClass);
                    if (!$container) {
                        $container = $element.parent();
                    }
                }
                else {
                    $container = $element.parent();
                }

                var scrollMin = 0;
                var scrollMax = 0;
                var scrollTransition = 0;
                // calculate the scroll limits for the affix element and the affix's container
                var calculateScrollLimits = function (scrollTop) {
                    var containerPosition = position($container);
                    var elementOffset = offset($element);

                    var containerTop = containerPosition.top;
                    var containerHeight = containerPosition.height;

                    var affixHeight = elementOffset.height;

                    scrollMin = scrollTop + containerTop;
                    scrollMax = scrollMin + containerHeight;
                    scrollTransition = scrollMax - affixHeight;
                };
                // throttled version of the same calculation
                var throttledCalculateScrollLimits = throttle(
                    calculateScrollLimits,
                    CALCULATION_THROTTLE_MS,
                    {trailing: false}
                );

                var affixClone = null;

                // creates the affix clone and adds it to DOM. by default it is put to top
                var createAffixClone = function () {
                    var clone = $element.clone().css({
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0
                    });

                    // if directive is given an additional CSS class to apply to the clone, then apply it
                    if ($attr.affixClass) {
                        clone.addClass($attr.affixClass);
                    }

                    angular.element($ionicScroll.element).append(clone);

                    return clone;
                };

                // removes the affix clone from DOM. also deletes the reference to it in the memory.
                var removeAffixClone = function () {
                    if (affixClone)
                        affixClone.remove();
                    affixClone = null;
                };

                $scope.$on('$destroy', removeAffixClone);


                angular.element($ionicScroll.element).on('scroll', function (event) {
                    var scrollTop = (event.detail || event.originalEvent && event.originalEvent.detail).scrollTop;
                    // when scroll to top, we should always execute the immediate calculation.
                    // this is because of some weird problem which is hard to describe.
                    // if you want to experiment, always use the throttled one and just click on the page
                    // you will see all affix elements stacked on top
                    if (scrollTop == 0) {
                        calculateScrollLimits(scrollTop);
                    }
                    else {
                        throttledCalculateScrollLimits(scrollTop);
                    }

                    // when we scrolled to the container, create the clone of element and place it on top
                    if (scrollTop >= scrollMin && scrollTop <= scrollMax) {

                        // we need to track if we created the clone just now
                        // that is important since normally we apply the transforms in the animation frame
                        // but, we need to apply the transform immediately when we add the element for the first time. otherwise it is too late!
                        var cloneCreatedJustNow = false;
                        if (!affixClone) {
                            affixClone = createAffixClone();
                            cloneCreatedJustNow = true;
                        }

                        // if we're reaching towards the end of the container, apply some nice translation to move up/down the clone
                        // but if we're reached already to the container and we're far away than the end, move clone to top
                        if (scrollTop > scrollTransition) {
                            translateUp(affixClone[0], Math.floor(scrollTop - scrollTransition), cloneCreatedJustNow);
                        } else {
                            translateUp(affixClone[0], 0, cloneCreatedJustNow);
                        }
                    } else {
                        removeAffixClone();
                    }
                });
            }
        }
    }])


.directive('elasticHeader', function($ionicScrollDelegate) {
    return {
        restrict: 'A',
        link: function(scope, element, attr) {
            var scroller = $ionicScrollDelegate.$getByHandle(attr.scrollHandle);
            var header = element[0];            
            var headerHeight = header.clientHeight;
            var translateAmt, scaleAmt, scrollTop;
            
            // Update header height on resize:
            window.addEventListener('resize', function() {
                headerHeight = header.clientHeight;
            }, false);

            scroller.getScrollView().onScroll = function() {
                // Get scroll position:
                scrollTop = scroller.getScrollPosition().top;

                if (scrollTop >= 0) {
                    // Scrolling up. Header should shrink:
                    translateAmt = scrollTop / 2;
                    scaleAmt = 1;
                } else {
                    // Scrolling down. Header should expand:
                    translateAmt = scrollTop / 2;
                    scaleAmt = -scrollTop / headerHeight + 1;
                }
                
                // Update header with new position/size:
                header.style[ionic.CSS.TRANSFORM] = 'translate3d(0,'+translateAmt+'px,0) scale('+scaleAmt+','+scaleAmt+')';
            };
        }
    }
})


 .directive("calendarSlide", function() {
    return {
        restrict: "E",
        scope: {
            title: '@',
            displayDate: '@',
            date: '=',
            activities: '=',
            filterName: '@', 
            activityChanged: '&', 
            onRefresh: '&'
        },
        //template: "<button ng-click='updateFn({msg: \"Test\"})'> Click </button>",
        templateUrl: "templates/directives/calendarSlide.html",
        link: function(scope, elm,attrs) {
        }, 
        controller: function($scope) {

            $scope.UTCDate = function(date) {
                return moment.utc(date);
            }

            $scope.dateFilter = function(item){
                var match = false; 
                switch ($scope.filterName){
                    case "beforeFilter":
                        match = moment.utc(item.StartDate).local().startOf('Day').isSame($scope.date) || 
                           moment.utc(item.StartDate).local().startOf('Day').isBefore($scope.date) ;
                        break; 
                    case "sameFilter":
                        match = moment.utc(item.StartDate).local().startOf('Day').isSame($scope.date);
                        break; 
                    case "afterFilter":
                        match =  moment.utc(item.StartDate).local().startOf('Day').isSame($scope.date) || 
                            moment.utc(item.StartDate).startOf('Day').isAfter($scope.date);
                        break; 
                    default: 
                        match = false; 
                };
                return match; 
            };
        }
    }
})

// Select Box Directive - Allows User to Select from a list
// http://codepen.io/mhartington/pen/KobJE
.directive('selectBox', function () {
    return {
        restrict: 'E',
        require: ['ngModel', 'ngData', 'ngSelectedId', 'ngSelectedValue', '?ngTitle', 'ngiItemName', 'ngItemId'],
        template:  '<input type="text" ng-click="showSelectModal()" readonly/>',
        controller: function ($scope, $element, $attrs, $ionicModal, $parse) {
            $scope.modal = {};

            $scope.showSelectModal = function () {
                var val = $parse($attrs.ngData);
                $scope.data.selectBoxList = val($scope);

                $scope.modal.show();
            };

            $scope.closeSelectModal = function () {
                $scope.modal.hide();
            };

            $scope.$on('$destroy', function (id) {
                $scope.modal.remove();
            });

            //{{'Gift.modalTitle' | translate}}
            $scope.modal = $ionicModal.fromTemplate('<ion-modal-view id="select">' + 
                '<ion-header-bar class="bar bar-OG">' + '<h1 class="title">' + 
                $attrs.ngTitle + '</h1>' + 
                ' <a ng-click="closeSelectModal()" class="button button-clear icon ion-close"></a>' + 
                '</ion-header-bar>' + '<ion-content>' + '<ul class="list">' + 
                '<li class="item" ng-click="clickItem(item)" ng-repeat="item in data.selectBoxList" ng-bind-html="item[\'' + 
                $attrs.ngItemName + '\']"></li>' + '</ul>' + ' </ion-content>' + '</ion-modal-view>', {
                scope: $scope,
                animation: 'slide-in-up'
            });

            $scope.clickItem = function (item) {
                var index = $parse($attrs.ngSelectedId);
                index.assign($scope.$parent, item[$attrs.ngItemId]);

                var value = $parse($attrs.ngSelectedValue);
                value.assign($scope.$parent, item[$attrs.ngItemName]);

                $scope.closeSelectModal();
            };
        },
        compile: function ($element, $attrs) {
            var input = $element.find('input');
            angular.forEach({
                'name': $attrs.name,
                'placeholder': $attrs.ngPlaceholder,
                'ng-model': $attrs.ngSelectedValue
            }, function (value, name) {
                if (angular.isDefined(value)) {
                    input.attr(name, value);
                }
            });

            var span = $element.find('span');
            if (angular.isDefined($attrs.ngSelectedId)) {
                span.attr('ng-model', $attrs.ngSelectedId);
            }
        }
    };
})

// Auto List Divider - Automatically creates dividers between list items
// https://github.com/andrewmcgivery/ionic-ion-autoListDivider

.directive('autoListDivider', function($timeout) {  
   
    var lastDivideKey = "";

    return {
    link: function(scope, element, attrs) {
        var key = attrs.autoListDividerValue;

        var dividers = document.getElementsByClassName("item-divider");

        
        while(dividers.length > 0)
        {
            dividers[0].parentNode.removeChild(dividers[0]);
        }

        var defaultDivideFunction = function(k){
            return k.slice( 0, 1 ).toUpperCase();
        }

        var doDivide = function(){
            var divideFunction = scope.$apply(attrs.autoListDividerFunction) || defaultDivideFunction;


            var divideKey = divideFunction(key);

            if(divideKey != lastDivideKey) { 
                var contentTr = angular.element("<div class='item item-divider'>"+divideKey+"</div>");
                element[0].parentNode.insertBefore(contentTr[0], element[0]);
            }

            lastDivideKey = divideKey;
        }

        $timeout(doDivide,0)
    }
    }
});

// Sticky Divider Directive - Makes A-Z List Dividers stick to top when scrolling - CURRENTLY NOT IMPLEMENTED Causes issue with Auto-Dividers
// http://codepen.io/anon/pen/EawXRO

// .directive('sticky', function($ionicScrollDelegate) {
//     var options,
//         defaults = {
//         classes: {
//             animated: 'item-animated',
//             container: 'item-wrapper',
//             hidden: 'item-hidden',
//             stationaryHeader: 'item item-divider'
//         },
//         selectors: {
//             groupContainer: 'item-container',
//             groupHeader: 'item-divider',
//             stationaryHeader: 'ion-item'
//         }
//     };
//     return {
//         restrict: 'A',
//         link: function(scope, element, attrs, ctrl) {

//                 var items = [],
//                     options = angular.extend(defaults, attrs),
//                     $element = angular.element(element),
//                     $fakeHeader = angular.element('<div class="' + options.classes.stationaryHeader + '"/>'),
//                     $groupContainer = angular.element($element[0].getElementsByClassName(options.selectors.groupContainer));

//                 $element.addClass('list-sticky');

//                 angular.element($element[0].getElementsByClassName('list')).addClass(options.classes.container);

//                 $element.prepend($fakeHeader);

//                 angular.forEach($groupContainer, function(elem, index) {

//                     var $tmp_list = $groupContainer.eq(index);
//                         $tmp_header = angular.element($tmp_list[0].getElementsByClassName(options.selectors.groupHeader)).eq(0),
//                         $tmp_listHeight = $tmp_list.prop('offsetHeight'),
//                         $tmp_listOffset = $tmp_list[0].getBoundingClientRect().top ;

//                     items.push({
//                         'list': $tmp_list,
//                         'header': $tmp_header,
//                         'listHeight': $tmp_listHeight,
//                         'headerText': $tmp_header.text(),
//                         'headerHeight': $tmp_header.prop('offsetHeight'),
//                         'listOffset': $tmp_listOffset,
//                         'listBottom': $tmp_listHeight + $tmp_listOffset
//                     });
//                 });

//                 $fakeHeader.text(items[0].headerText);

//                 scope.checkPosition = function() {
//                     var i = 0,
//                         topElement, offscreenElement, topElementBottom,
//                         currentTop = $ionicScrollDelegate.$getByHandle('scrollHandle').getScrollPosition().top;

//                     while ((items[i].listOffset - currentTop) <= 0) {
//                         topElement = items[i];
//                         topElementBottom = -(topElement.listBottom - currentTop);

//                         if (topElementBottom < -topElement.headerHeight) {
//                             offscreenElement = topElement;
//                         }

//                         i++;

//                         if (i >= items.length) {
//                             break;
//                         }
//                     }


//                     if (topElement) {

//                         if (topElementBottom < 0 && topElementBottom > -topElement.headerHeight) {
//                             $fakeHeader.addClass(options.classes.hidden);
//                             angular.element(topElement.list).addClass(options.classes.animated);
//                         } else {
//                             $fakeHeader.removeClass(options.classes.hidden);
//                             if (topElement) {
//                                 angular.element(topElement.list).removeClass(options.classes.animated);
//                             }
//                         }
//                         $fakeHeader.text(topElement.headerText);
//                     } else {
//               $fakeHeader.addClass(options.classes.hidden);
//             }
//             }
//         }

//     };