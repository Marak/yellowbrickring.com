(() => {
  class WebringWidget extends HTMLElement {
    constructor() {
      super()
      this.attachShadow({ mode: 'open' })

      this.size = this.getAttribute('size') || 'full'
    }

    async connectedCallback() {
      const siteId = this.getAttribute('site-id')
      if (!siteId) {
        this.renderError('Missing site-id attribute')
        return
      }

      const apiUrl = window.yellowBrickRingApiUrl || 'https://yellowbrickring.com'

      try {
        const res = await fetch(`${apiUrl}/sites.json`)
        if (!res.ok) throw new Error('Failed to fetch site list')
        const sites = await res.json()

        const index = sites.findIndex(s => s.id === siteId)
        if (index === -1) {
          this.renderError(`Site ID "${siteId}" not found in the ring.`)
          return
        }

        const randomUrl = `${apiUrl}/webring?from=${siteId}&to=random`

        if(this.size === 'full') {
          this.shadowRoot.innerHTML = `
            <style>
              .webring {
                font-family: sans-serif;
                background: var(--ybr-background-color, #fff9d6);
                border: 1px solid var(--ybr-border-color, #ffd700); 
                color: var(--ybr-text-color, #000); 
                padding: 0.5rem 1rem;
                display: inline-block;
                font-size: 0.9rem;
                border-radius: 6px;
              }
              .webring a {
                color: var(--ybr-link-color, #b87b00);
                text-decoration: none;
                margin: 0 0.4rem;
              }
              .webring a:hover {
                text-decoration: underline;
              }
            </style>
            <div class="webring">
              <a href="${apiUrl}/webring?from=${siteId}&to=prev">← Prev</a> |
              Part of <strong><a href="${apiUrl}">Yellow Brick Ring</a></strong> |
              <a href="${apiUrl}/webring?from=${siteId}&to=next">Next →</a> |
              <a href="${randomUrl}">🎲 Random</a>
            </div>
          `
        } else if(this.size === 'compact') {
          this.shadowRoot.innerHTML = `
            <style>
              .webring {
                font-family: sans-serif;
                background: var(--ybr-background-color, #fff9d6);
                border: 1px solid var(--ybr-border-color, #ffd700); 
                color: var(--ybr-text-color, #000); 
                padding: 0.5rem;
                display: inline-flex;
                font-size: 0.9rem;
                border-radius: 6px;


              }
              .webring a {
                color: var(--ybr-link-color, #b87b00);
                text-decoration: none;
                margin: 0 0.4rem;
              }
              .webring a:hover {
                text-decoration: underline;
              }
            </style>
            <div class="webring">
              <a href="${apiUrl}"><strong>YBR</strong></a>
              <a href="${apiUrl}/webring?from=${siteId}&to=prev">Prev</a> |
              <a href="${apiUrl}/webring?from=${siteId}&to=next">Next</a> |
              <a href="${randomUrl}">Rand</a>
            </div>
          `
        } else {
          console.error('[YellowBrickRing Widget]', 'invalid "size" attribute')
          this.renderError('Failed to load webring widget')
        }
        
      } catch (err) {
        console.error('[YellowBrickRing Widget]', err)
        this.renderError('Failed to load webring widget')
      }
    }

    renderError(msg) {
      this.shadowRoot.innerHTML = `
        <style>
          .error { font-family: sans-serif; color: red; font-size: 0.9rem; }
        </style>
        <div class="error">${msg}</div>
      `
    }
  }

  customElements.define('webring-widget', WebringWidget)
})()
