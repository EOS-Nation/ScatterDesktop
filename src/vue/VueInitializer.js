import Vue from 'vue'
import VTooltip from 'v-tooltip'
import VueQrcodeReader from 'vue-qrcode-reader'
import VueTour from 'vue-tour'



import VueRouter from 'vue-router'
import {Routing} from './Routing';
import {store} from '../store/store'
import * as Actions from '../store/constants'
import {localized} from '../localization/locales'
import * as LANG_KEYS from '../localization/keys'
import ElectronHelpers from '../util/ElectronHelpers'
import PriceService from '../services/PriceService';

/***
 * Sets up an instance of Vue.
 * This is shared between the popup.js and prompt.js scripts.
 */
export default class VueInitializer {

    constructor(routes,
                components,
                middleware = () => {},
                routerCallback = () => {}){
        this.setupVuePlugins();
        this.registerComponents(components);
        const router = this.setupRouting(routes, middleware);

        store.dispatch(Actions.LOAD_SCATTER).then(async () => {



            Vue.mixin({
                data(){ return {
                    langKeys:LANG_KEYS,
                }},
                methods: {
                    bind(changed, dotNotation) {
                        let props = dotNotation.split(".");
                        const lastKey = props.pop();
                        props.reduce((obj,key)=> obj[key], this)[lastKey] = changed;
                    },
                    openInBrowser(url){
                        ElectronHelpers.openLinkInBrowser(url);
                    },
                    locale:(key) => localized(key, store.getters.language),
                    scrollTo(step){
                        const ref = typeof step === 'object' ? step.ref : step;
                        if(typeof step === 'object') this.onStep = step;
                        this.$refs.scroller.scrollTop = this.$refs[step.ref].offsetTop-120;
                    },
                }
            })

            this.setupVue(router);

            routerCallback(router, store);
        });

        return router;
    }

    setupVuePlugins(){
        Vue.use(VueRouter);
        Vue.use(VTooltip, {
            defaultOffset:5
        });
        Vue.use(VueQrcodeReader);
        Vue.use(VueTour);
    }

    registerComponents(components){
        components.map(component => {
            Vue.component(component.tag, component.vue);
        });
    }

    setupRouting(routes, middleware){
        const router = new VueRouter({routes});
        router.beforeEach((to, from, next) => {
            store.dispatch(Actions.SET_SEARCH_TERMS, '');
            return middleware(to, next, store)
        });
        return router;
    }

    setupVue(router){
        const app = new Vue({router, store});
        app.$mount('#scatter');

        // This removes the browser console's ability to
        // gain access to vuex store. ( for instance `scatter.__vue__.$store.state` )
        document.getElementById('scatter').removeAttribute('id')
    }

}