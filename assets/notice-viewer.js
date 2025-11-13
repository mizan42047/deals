class NMNotices {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    if (!this.container) return;

    this.closedNotices = new Set(
      JSON.parse(localStorage.getItem("closedNotices")) || []
    );

    this.imageCache = new Map();
    this.observers = {};
    this.debug = false;

    this.init();
  }

  log(message, data = null) {
    if (this.debug) {
      console.log('[BdThemes Notice Viewer]', message, data);
    }
  }

  init() {
    this.setupObservers();
    this.manageClosedNotices();
    this.initCountdowns();
    this.bindCloseButtons();
    this.processVisibleImages();
  }

  setupObservers() {
    // Animation observer
    this.observers.animation = new IntersectionObserver(
      entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("nm-visible");
          this.observers.animation.unobserve(entry.target);
        }
      }),
      { threshold: 0.1, rootMargin: '50px' }
    );

    // Image loading observer
    this.observers.images = new IntersectionObserver(
      entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage(entry.target);
          this.observers.images.unobserve(entry.target);
        }
      }),
      { threshold: 0.1, rootMargin: '100px' }
    );

    // Observe elements
    this.container.querySelectorAll(".nm-animate-in, .nm-logo-animate").forEach(el =>
      this.observers.animation.observe(el)
    );

    const images = this.container.querySelectorAll("img[data-src], .nm-notice-bg[data-bg-image]");
    this.log(`Found ${images.length} images to load`);
    images.forEach(img => this.observers.images.observe(img));
  }

  async loadImage(element) {
    const isImg = element.tagName === 'IMG';
    const src = isImg ? element.getAttribute('data-src') : element.getAttribute('data-bg-image');

    if (!src) return;

    this.log(`Loading ${isImg ? 'image' : 'background'}:`, src);

    // Check cache
    if (this.imageCache.has(src)) {
      this.setImage(element, this.imageCache.get(src), isImg);
      return;
    }

    // Handle data URLs
    if (src.startsWith('data:')) {
      this.setImage(element, src, isImg);
      this.imageCache.set(src, src);
      return;
    }

    this.setImage(element, src, isImg);

  }

  setImage(element, url, isImg) {
    if (isImg) {
      element.src = url;
      element.removeAttribute('data-src');
    } else {
      element.style.backgroundImage = `url(${url})`;
      element.removeAttribute('data-bg-image');
    }
    element.classList.add('loaded');
  }

  processVisibleImages() {
    this.container.querySelectorAll("img[data-src], .nm-notice-bg[data-bg-image]").forEach(element => {
      const rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        this.loadImage(element);
      }
    });
  }

  manageClosedNotices() {
    this.closedNotices.forEach(id => {
      const notice = this.container.querySelector(`.nm-notice[data-notice-id='${id}']`);
      if (notice) notice.style.display = "none";
    });
  }

  initCountdowns() {
    this.container.querySelectorAll(".nm-countdown").forEach(el => {
      const endTime = el.getAttribute("data-end-time");
      if (endTime) this.runCountdown(el, new Date(endTime).getTime());
    });
  }

  runCountdown(el, targetTime) {
    const template = `
      <div class="count-item days" style="--item-index: 0"><span class="count-number">00</span><span class="label"> days</span></div>
      <span class="count-separator"></span>
      <div class="count-item hours" style="--item-index: 1"><span class="count-number">00</span><span class="label"> hrs</span></div>
      <span class="count-separator"></span>
      <div class="count-item minutes" style="--item-index: 2"><span class="count-number">00</span><span class="label"> mins</span></div>
      <span class="count-separator"></span>
      <div class="count-item seconds" style="--item-index: 3"><span class="count-number">00</span><span class="label"> secs</span></div>
    `;

    el.innerHTML = template;

    const elements = {
      days: el.querySelector('.days .count-number'),
      hours: el.querySelector('.hours .count-number'),
      minutes: el.querySelector('.minutes .count-number'),
      seconds: el.querySelector('.seconds .count-number')
    };

    const update = () => {
      const timeLeft = targetTime - Date.now();
      if (timeLeft < 0) {
        el.textContent = "Expired";
        clearInterval(el.timer);
        return;
      }

      const days = String(Math.floor(timeLeft / 86400000)).padStart(2, "0");
      const hours = String(Math.floor((timeLeft % 86400000) / 3600000)).padStart(2, "0");
      const minutes = String(Math.floor((timeLeft % 3600000) / 60000)).padStart(2, "0");
      const seconds = String(Math.floor((timeLeft % 60000) / 1000)).padStart(2, "0");

      elements.days.textContent = days;
      elements.hours.textContent = hours;
      elements.minutes.textContent = minutes;
      elements.seconds.textContent = seconds;
    };

    el.timer = setInterval(update, 1000);
    update();
  }

  bindCloseButtons() {
    this.container.querySelectorAll(".nm-notice").forEach(notice => {
      const closeButton = notice.querySelector(".nm-notice-close");
      const noticeId = notice.getAttribute("data-notice-id");

      if (!closeButton || !noticeId) return;

      closeButton.addEventListener("click", () => {
        notice.style.display = "none";

        const closedNotices = new Set(
          JSON.parse(localStorage.getItem("closedNotices")) || []
        );
        closedNotices.add(noticeId);
        localStorage.setItem("closedNotices", JSON.stringify([...closedNotices]));

        setTimeout(() => this.reopenNotice(noticeId), 21600000);
      });
    });
  }

  reopenNotice(noticeId) {
    this.closedNotices.delete(noticeId);
    localStorage.setItem("closedNotices", JSON.stringify([...this.closedNotices]));
    if (this.container) this.container.style.display = "block";
  }

  destroy() {
    Object.values(this.observers).forEach(observer => observer?.disconnect());
    this.imageCache.clear();
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.bdthemesNotices = new NMNotices("#nm-notices-container");
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  window.bdthemesNotices?.destroy();
});
