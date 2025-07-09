(() => {
  class WebringWidget extends HTMLElement {
    constructor() {
      super()
      this.attachShadow({ mode: 'open' })
    }

    async connectedCallback() {
      const siteId = this.getAttribute('site-id')
      const sizeAttr = this.getAttribute('size') // "compact", "full", or null
      const apiUrl = window.yellowBrickRingApiUrl || 'https://yellowbrickring.com'

      if (!siteId) {
        this.renderError('Missing site-id attribute')
        return
      }

      try {
        const randomUrl = `${apiUrl}/webring?from=${siteId}&to=random`
        const modeClass = sizeAttr === 'compact'
          ? 'compact'
          : sizeAttr === 'full'
          ? 'full'
          : 'auto' // default (responsive)

        this.shadowRoot.innerHTML = this.templateHTML({ apiUrl, siteId, randomUrl, modeClass })

      } catch (err) {
        console.error('[YellowBrickRing Widget]', err)
        this.renderError('Failed to load webring widget')
      }
    }

    templateHTML({ apiUrl, siteId, randomUrl, modeClass }) {
      return `
        <style>
          .webring {
            font-family: sans-serif;
            background: var(--ybr-background-color, #fff9d6);
            border: 1px solid var(--ybr-border-color, #ffd700); 
            color: var(--ybr-text-color, #000); 
            padding: 0.5rem 1rem;
            font-size: 0.9rem;
            border-radius: 6px;
            display: inline-flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 0.3rem;
          }

          .webring a {
            color: var(--ybr-link-color, #b87b00);
            text-decoration: none;
          }

          .webring a:hover {
            text-decoration: underline;
          }

          /* Hide full labels in compact mode */
          .webring.compact .full-label,
          .webring.compact .divider {
            display: none;
          }

          /* Auto mode becomes compact on small screens */
          .webring.auto .full-label,
          .webring.auto .divider {
            display: inline;
          }

          @media (max-width: 480px) {
            .webring.auto .full-label,
            .webring.auto .divider {
              display: none;
            }
          }
        </style>
        <div class="webring ${modeClass}">
          <a href="${apiUrl}/webring?from=${siteId}&to=prev">← Prev</a>
          <span class="divider">|</span>
          <span class="full-label">Part of <strong><a href="${apiUrl}">Yellow Brick Ring</a></strong></span>
          <span class="divider">|</span>
          <a href="${apiUrl}/webring?from=${siteId}&to=next">Next →</a>
          <span class="divider">|</span>
          <a href="${randomUrl}">🎲 Random</a>
        </div>
      `
    }

    renderError(msg) {
      this.shadowRoot.innerHTML = `
        <style>
          .error {
            font-family: sans-serif;
            color: red;
            font-size: 0.9rem;
          }
        </style>
        <div class="error">${msg}</div>
      `
    }
  }

  customElements.define('webring-widget', WebringWidget)
})()