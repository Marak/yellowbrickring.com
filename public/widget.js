(() => {
  class WebringWidget extends HTMLElement {
    constructor() {
      super()
      this.attachShadow({ mode: 'open' })
    }

    async connectedCallback() {
      const siteId = this.getAttribute('site-id')
      if (!siteId) {
        this.renderError('Missing site-id attribute')
        return
      }

      const apiUrl = window.yellowBrickRingApiUrl || window.location.origin

      try {
        const res = await fetch(`${apiUrl}/sites.json`)
        if (!res.ok) throw new Error('Failed to fetch site list')
        const sites = await res.json()

        const index = sites.findIndex(s => s.id === siteId)
        if (index === -1) {
          this.renderError(`Site ID "${siteId}" not found in the ring.`)
          return
        }

        const prev = sites[(index - 1 + sites.length) % sites.length]
        const next = sites[(index + 1) % sites.length]
        const randomUrl = `${apiUrl}/webring?from=${siteId}&to=random`

        this.shadowRoot.innerHTML = `
          <style>
            .webring {
              font-family: sans-serif;
              background: #fff9d6;
              border: 1px solid #ffd700;
              padding: 0.5rem 1rem;
              display: inline-block;
              font-size: 0.9rem;
              border-radius: 6px;
            }
            .webring a {
              color: #b87b00;
              text-decoration: none;
              margin: 0 0.4rem;
            }
            .webring a:hover {
              text-decoration: underline;
            }
          </style>
          <div class="webring">
            <a href="${apiUrl}/webring?from=${siteId}&to=prev">← Prev</a> |
            Part of <strong>Yellow Brick Ring</strong> |
            <a href="${apiUrl}/webring?from=${siteId}&to=next">Next →</a> |
            <a href="${randomUrl}">🎲 Random</a>
          </div>
        `
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
