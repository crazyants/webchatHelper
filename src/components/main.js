import html from './main.html'

class Ctrl {
    constructor(services) {
        this.services = services
        this.active   = false
        this.scene    = 1
    }

    toScene(index) {
        this.scene = index
    }
}

export default {
    Ctrl,
    html: html
}