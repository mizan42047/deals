(function ($) {
  "use strict";

  $(window).on("elementor/frontend/init", function () {
    elementorFrontend.hooks.addAction(
      "frontend/element_ready/bdt_pricing_plan.default",
      function ($scope) {
        $scope.find(".bdt-pricing-plan").each(function () {
          const $pricingPlan = $(this);

          const settings = $pricingPlan.data("settings");
          // let coupon = settings.auto_apply_coupon || settings.coupon;
          // if (coupon) {
          //   setTimeout(
          //     () => {
          //       $pricingPlan
          //         .find(".discount-wrap-inner, .bdt-discount-price")
          //         .addClass("coupon-applied");
          //       fastspring.builder.push({ coupon });
          //     },
          //     settings.auto_apply_coupon ? 0 : 1800
          //   );
          // }
        });

        // Initialize custom pricing filter/switcher
        initPricingFilter($scope);

        // Initialize static combo switcher
        initStaticComboSwitcher($scope);

        // Add delay to ensure DOM is fully rendered and heights are available
        setTimeout(function () {
          initConditionalToggle($scope);
        }, 1000);

        // Listen for filter/tab changes and re-initialize
        $scope.find('[data-filter-tab]').off('click.heightToggle').on('click.heightToggle', function () {
          setTimeout(function () {
            initConditionalToggle($scope);
          }, 500);
        });

        // Listen for window resize to handle mobile/desktop switching
        $(window).off('resize.heightToggle').on('resize.heightToggle', function () {
          clearTimeout(window.resizeTimer);
          window.resizeTimer = setTimeout(function () {
            initConditionalToggle($scope);
          }, 300);
        });

        // Clear expired countdowns before initializing new ones
        clearExpiredCountdowns();

        // Initialize countdown timer
        initCountdownTimer($scope);
      }
    );
  });

  // Custom Pricing Filter/Switcher Function
  function initPricingFilter($scope) {
    $scope.find('.bdt-pricing-plan').each(function () {
      const $pricingPlan = $(this);
      const $filterTabs = $pricingPlan.find('[data-filter-tab]');
      const $gridWrap = $pricingPlan.find('.bdt-pricing-grid-wrap');
      const $staticComboWrap = $pricingPlan.find('.bdt-static-combo-wrap');
      const $switcher = $pricingPlan.find('.bdt-pricing-switcher');

      // Get grid items only (not static combo items)
      const $gridItems = $gridWrap.find('.bdt-price-item');

      // Get static combo items separately
      const $staticComboItem = $staticComboWrap.find('.bdt-price-item');

      // Filter pricing items based on active tab - just show/hide without animation
      function filterPricingItems(filterValue) {
        // Filter grid items only
        $gridItems.each(function () {
          const $item = $(this);
          const itemFilter = $item.attr('data-filter');

          if (itemFilter === filterValue) {
            $item.show();
          } else {
            $item.hide();
          }
        });

        // Static combo wrapper always visible when layout is row
        // It's outside the filter system
        if ($staticComboWrap.length > 0) {
          $staticComboWrap.show();
        }
      }

      // Initial filter on page load
      const $activeTab = $filterTabs.filter('.bdt-active');
      if ($activeTab.length > 0) {
        const initialFilter = $activeTab.attr('data-filter-tab');
        filterPricingItems(initialFilter);
      }

      // Show content smoothly after filtering
      setTimeout(function () {
        $gridWrap.addClass('bdt-visible');
        $switcher.addClass('bdt-visible');
        if ($staticComboWrap.length > 0) {
          $staticComboWrap.addClass('bdt-visible');
        }
      }, 100);

      // Handle tab click events
      $filterTabs.off('click.pricingFilter').on('click.pricingFilter', function (e) {
        e.preventDefault();

        const $clickedTab = $(this);
        const filterValue = $clickedTab.attr('data-filter-tab');

        // Prevent same tab re-click
        if ($clickedTab.hasClass('bdt-active')) {
          return;
        }

        // Remove active class from all tabs
        $filterTabs.removeClass('bdt-active');

        // Add active class to clicked tab
        $clickedTab.addClass('bdt-active');

        // Filter items instantly
        filterPricingItems(filterValue);

        // Trigger height toggle reinitialization
        setTimeout(function () {
          initConditionalToggle($scope);
        }, 100);
      });
    });
  }

  // Static Combo Switcher Function
  function initStaticComboSwitcher($scope) {
    const $toggleWrapper = $scope.find('.bdt-static-combo-toggle-wrapper');

    if ($toggleWrapper.length === 0) return;

    const $toggleContainer = $toggleWrapper.find('.bdt-static-combo-toggle-container');
    const $staticComboWrap = $scope.find('.bdt-static-combo-wrap');
    const $toggle = $toggleContainer.find('[data-static-combo-toggle]');
    const $yearlyLabel = $toggleContainer.find('.bdt-toggle-yearly');
    const $lifetimeLabel = $toggleContainer.find('.bdt-toggle-lifetime');
    const $toggleKnob = $toggleContainer.find('.bdt-toggle-knob');
    const $priceWraps = $staticComboWrap.find('.bdt-price-wrap[data-static-combo-period]');

    // Get settings from data attribute
    const $pricingPlan = $scope.find('.bdt-pricing-plan');
    const settings = $pricingPlan.data('settings') || {};
    const defaultActive = settings.static_combo_default_active || 'lifetime';

    // Filter price wraps based on period
    function filterPriceWraps(isLifetime) {
      const filterValue = isLifetime ? 'lifeTime' : 'year';

      $priceWraps.each(function () {
        const $priceWrap = $(this);
        const itemPeriod = $priceWrap.attr('data-static-combo-period');
        if (itemPeriod === filterValue) {
          $priceWrap.show();
        } else {
          $priceWrap.hide();
        }
      });

      // Update label styles
      if (isLifetime) {
        $yearlyLabel.css('color', 'rgba(36, 5, 5, 0.6)');
        $lifetimeLabel.css('color', '#000');
        $toggleKnob.css('transform', 'translateX(16px)');
      } else {
        $yearlyLabel.css('color', '#000');
        $lifetimeLabel.css('color', 'rgba(36, 5, 5, 0.6)');
        $toggleKnob.css('transform', 'translateX(-3px)');
      }
    }

    // Set initial state based on settings
    const isInitiallyLifetime = defaultActive === 'lifetime';

    // Set checkbox state based on settings
    $toggle.prop('checked', isInitiallyLifetime);

    // Apply initial filter
    filterPriceWraps(isInitiallyLifetime);

    // Handle toggle change
    $toggle.off('change.staticComboToggle').on('change.staticComboToggle', function () {
      const isChecked = $(this).is(':checked');
      filterPriceWraps(isChecked);

      // Trigger height toggle reinitialization
      setTimeout(function () {
        initConditionalToggle($scope);
      }, 100);
    });

    // Handle label clicks
    $yearlyLabel.off('click.staticComboToggle').on('click.staticComboToggle', function () {
      if (!$toggle.is(':checked')) return;
      $toggle.prop('checked', false).trigger('change');
    });

    $lifetimeLabel.off('click.staticComboToggle').on('click.staticComboToggle', function () {
      if ($toggle.is(':checked')) return;
      $toggle.prop('checked', true).trigger('change');
    });
  }

  function initConditionalToggle($scope) {
    $scope.find(".bdt-pricing-plan").each(function () {
      const $pricingPlan = $(this);

      // Check if we're on mobile (767px or below) - tablet and desktop should show full content
      const isMobile = window.innerWidth <= 767;

      // Check if toggle button is enabled in widget settings
      const $toggleButtons = $pricingPlan.find(".toggle-button");
      if ($toggleButtons.length === 0) {
        // Toggle button is disabled in settings, skip initialization
        return;
      }

      // If not mobile, hide toggle buttons and show all content
      if (!isMobile) {
        $toggleButtons.hide();
        $pricingPlan.find(".bdt-pricing-list-wrap").css({
          'max-height': 'none',
          'overflow': 'visible',
          'mask-image': 'none'
        });
        // Special handling for static combo items
        $pricingPlan.find(".bdt-static-price-combo .bdt-pricing-list-wrap").css({
          'max-height': 'none',
          'overflow': 'visible',
          'mask-image': 'none'
        });
        $pricingPlan.find(".plan-feature-container").removeClass("has-toggle-button expanded-container");
        return;
      }

      // Reset all previous toggle states and styles
      $pricingPlan.find(".toggle-button").hide().removeClass("expanded-state");
      $pricingPlan.find(".bdt-pricing-list-wrap").removeClass("expanded");
      $pricingPlan.find(".plan-feature-container").removeClass("has-toggle-button expanded-container");
      $pricingPlan.find(".show-more").show();
      $pricingPlan.find(".show-less").hide();

      // Get only visible items for current tab
      const $visibleItems = $pricingPlan.find(".bdt-price-item:visible");
      const $normalItems = $visibleItems.not(".bdt-highlighted").not(".bdt-static-price-combo");
      const $specialItems = $visibleItems.filter(".bdt-highlighted, .bdt-static-price-combo");



      // Get normal items feature count and heights
      let normalFeatureCount = 0;
      let normalFeatureHeight = 0;

      // First ensure all elements are visible for proper height calculation
      $pricingPlan.find(".bdt-pricing-list-wrap").css({
        'max-height': 'none',
        'overflow': 'visible',
        'mask-image': 'none',
        'height': 'auto'
      });

      if ($normalItems.length > 0) {
        $normalItems.each(function () {
          const featureCount = $(this).find(".bdt-pricing-list-item").length;
          const $featureWrap = $(this).find(".bdt-pricing-list-wrap");

          normalFeatureCount = Math.max(normalFeatureCount, featureCount);

          if ($featureWrap.length > 0) {
            const featureHeight = $featureWrap.outerHeight(true); // Include margins
            normalFeatureHeight = Math.max(normalFeatureHeight, featureHeight);
          }
        });
      } else {
        // If no normal items visible (like in combo-only view), use special items as reference
        $specialItems.each(function () {
          const featureCount = $(this).find(".bdt-pricing-list-item").length;
          normalFeatureCount = Math.max(normalFeatureCount, featureCount);
        });
        normalFeatureHeight = 300; // Default for combo-only views
      }



      // Set a reasonable minimum height based on typical content
      if (normalFeatureHeight === 0 || normalFeatureHeight < 100) {
        normalFeatureHeight = 250; // More reasonable default
      }

      // Mobile check already done at function start

      // Handle all items that need toggle functionality
      const $itemsToProcess = isMobile ? $visibleItems : $specialItems;

      $itemsToProcess.each(function () {
        const $currentItem = $(this);
        const currentFeatureCount = $currentItem.find(".bdt-pricing-list-item").length;
        const $featureList = $currentItem.find(".bdt-pricing-list-wrap");
        const currentFeatureHeight = $featureList.outerHeight();
        const isStaticCombo = $currentItem.hasClass('bdt-static-price-combo');
        const isHighlighted = $currentItem.hasClass('bdt-highlighted');

        // Show toggle if mobile OR if special item has more features than normal OR if static combo height > 200px
        const shouldShowToggle = isMobile ||
          (currentFeatureCount > normalFeatureCount && (isHighlighted || isStaticCombo)) ||
          (isStaticCombo && currentFeatureHeight > 200);

        if (shouldShowToggle) {
          const $featureList = $currentItem.find(".bdt-pricing-list-wrap");
          const $toggleButton = $currentItem.find(".toggle-button");
          const $showMore = $currentItem.find(".show-more");
          const $showLess = $currentItem.find(".show-less");
          const $featureContainer = $currentItem.find(".plan-feature-container");

          // Store original height
          const originalHeight = $featureList.outerHeight();

          // Apply height matching - mobile gets limited height, desktop matches normal height
          const targetHeight = isMobile ? Math.min(normalFeatureHeight, 150) : normalFeatureHeight;

          $featureList.css({
            'max-height': targetHeight + 'px',
            'overflow': 'hidden',
            'position': 'relative',
            'transition': 'max-height 0.4s ease',
            'mask-image': 'linear-gradient(#000 75%, transparent)'
          });

          // Show toggle button and add container padding
          $toggleButton.show();
          $currentItem.find(".plan-feature-container").addClass("has-toggle-button");
          $showMore.show();
          $showLess.hide();

          // Store the original height for this specific item
          $toggleButton.data('originalHeight', originalHeight);

          // Add toggle functionality (remove previous handlers first)
          $toggleButton.off("click.heightToggle").on("click.heightToggle", function (e) {
            e.preventDefault();
            e.stopPropagation();

            // Only allow toggle on mobile devices (767px or below)
            const currentIsMobile = window.innerWidth <= 767;
            if (!currentIsMobile) {
              return false;
            }

            // Get the current button and its stored data
            const $currentButton = $(this);
            const storedOriginalHeight = $currentButton.data('originalHeight');
            const $currentItem = $currentButton.closest(".bdt-price-item");

            // Get elements specific to this item only - use direct traversal
            const $currentFeatureContainer = $currentButton.closest(".plan-feature-container");
            const $currentFeatureList = $currentFeatureContainer.find(".bdt-pricing-list-wrap").first();
            const $currentShowMore = $currentButton.children(".show-more");
            const $currentShowLess = $currentButton.children(".show-less");

            const isExpanded = $currentFeatureList.hasClass("expanded");

            if (isExpanded) {
              // Collapse to normal height
              $currentFeatureList.removeClass("expanded");
              $currentButton.removeClass("expanded-state");
              $currentFeatureContainer.removeClass("expanded-container");

              // Use mobile-optimized height for collapse
              const currentTargetHeight = Math.min(normalFeatureHeight, 150);

              $currentFeatureList.css({
                'max-height': currentTargetHeight + 'px',
                'mask-image': 'linear-gradient(#000 75%, transparent)'
              });
              $currentShowMore.show();
              $currentShowLess.hide();
            } else {
              // Expand to full height
              $currentFeatureList.addClass("expanded");
              $currentButton.addClass("expanded-state");
              $currentFeatureContainer.addClass("expanded-container");
              $currentFeatureList.css({
                'max-height': storedOriginalHeight + 20 + 'px',
                'mask-image': 'none'
              });
              $currentShowMore.hide();
              $currentShowLess.show();
            }
          });
        }
      });
    });
  }

  // localStorage management functions for countdown timer
  function getCountdownFromStorage(countdownId) {
    try {
      const stored = localStorage.getItem(countdownId);
      if (stored) {
        const data = JSON.parse(stored);
        const now = new Date().getTime();

        // Check if countdown has expired
        if (data.targetDate > now) {
          return data.targetDate;
        } else {
          // Expired, remove from storage
          localStorage.removeItem(countdownId);
          return null;
        }
      }
    } catch (error) {
      console.warn('Error reading countdown from localStorage:', error);
    }
    return null;
  }

  function setCountdownInStorage(countdownId, targetDate, expiryDays) {
    try {
      const data = {
        targetDate: targetDate,
        expiryDays: expiryDays,
        createdAt: new Date().getTime()
      };
      localStorage.setItem(countdownId, JSON.stringify(data));
    } catch (error) {
      console.warn('Error saving countdown to localStorage:', error);
    }
  }

  function clearExpiredCountdowns() {
    try {
      const now = new Date().getTime();
      const keysToRemove = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('bdt_countdown_')) {
          const stored = localStorage.getItem(key);
          if (stored) {
            const data = JSON.parse(stored);
            if (data.targetDate <= now) {
              keysToRemove.push(key);
            }
          }
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Error clearing expired countdowns:', error);
    }
  }

  function initCountdownTimer($scope) {
    $scope.find('.bdt-countdown-timer').each(function () {
      const $countdown = $(this);
      const $days = $countdown.find('[data-time="days"]');
      const $hours = $countdown.find('[data-time="hours"]');
      const $minutes = $countdown.find('[data-time="minutes"]');
      const $seconds = $countdown.find('[data-time="seconds"]');

      // Get data attributes
      const fallbackTimestamp = parseInt($countdown.attr('data-target-date'));
      const countdownId = $countdown.attr('data-countdown-id');
      const expiryDays = parseInt($countdown.attr('data-expiry-days'));

      // If no valid fallback date or countdown ID, skip this countdown
      if (!fallbackTimestamp || isNaN(fallbackTimestamp) || !countdownId) {
        return;
      }

      // Check localStorage for existing countdown
      let targetDate = getCountdownFromStorage(countdownId);

      if (!targetDate) {
        // No stored countdown, create new one
        const offset = (1 * 3600 + 20 * 60 + 15) * 1000; // 1h 20m 15s in ms
        targetDate = Date.now() + expiryDays * 24 * 60 * 60 * 1000 - offset;
        setCountdownInStorage(countdownId, targetDate, expiryDays);
      }

      function updateCountdown() {
        const now = new Date().getTime();
        const distance = targetDate - now;

        // Calculate time units
        if (distance > 0) {
          const days = Math.floor(distance / (1000 * 60 * 60 * 24));
          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);

          // Update DOM elements with padded values
          $days.text(String(days).padStart(2, '0'));
          $hours.text(String(hours).padStart(2, '0'));
          $minutes.text(String(minutes).padStart(2, '0'));
          $seconds.text(String(seconds).padStart(2, '0'));
        } else {
          // Countdown finished - clear from localStorage and stop interval
          localStorage.removeItem(countdownId);
          clearInterval(countdownInterval);

          $days.text('00');
          $hours.text('00');
          $minutes.text('00');
          $seconds.text('00');
        }
      }

      // Update immediately and then every second
      updateCountdown();
      const countdownInterval = setInterval(updateCountdown, 1000);

      // Store interval ID to clear it later if needed
      $countdown.data('countdown-interval', countdownInterval);
    });
  }
})(jQuery);