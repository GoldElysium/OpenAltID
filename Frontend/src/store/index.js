import Vue from 'vue'
import Vuex from 'vuex'
import Cookies from 'js-cookie'


Vue.use(Vuex)

let BACKEND_API_BASEURI = 'http://127.0.0.1:5000'

export default new Vuex.Store({
    state: {
        BACKEND_API_BASEURI: BACKEND_API_BASEURI,
        logged_in: false,
        token: Cookies.get('token') || ''
    },
    mutations: {
        setToken: (state, token, status) => {
            Cookies.set('token', token, {secure: true, sameSite: 'lax'})
            state.logged_in = status
        },
        setLoggedin: (state, status) => {
            console.log("Setting logged in to"+status)
            state.logged_in = status
        }
    },
    actions: {
        login({commit}, access_code) {
            return new Promise((resolve) => {
                let token
                // Login and get the JWT
                fetch('http://127.0.0.1:5000' + "/api/auth/login/discord", {
                    method: "post",
                    credentials: "include",
                    headers: {
                        "Content-Type": "Application/json"
                    },
                    body: JSON.stringify({
                        "access_code": access_code,
                        "redirect_uri": "http://127.0.0.1:8000/discordredirect"
                    })
                }).then((response) => response.json()).then(response_json => {
                    token = response_json.success
                    if (token === true) {
                        commit('setToken', token, true)
                        resolve(true)
                    } else {
                        commit('setToken', '', false)
                        resolve(false)
                    }
                })
            })
        },
        verifyLogin({commit}) {
            return new Promise(resolve => {
                fetch('http://127.0.0.1:5000' + "/api/auth/is-logged-in", {
                    credentials: "include"
                }).then(response => response.json()).then(response_json => {
                    if (response_json.success === true) {
                        commit('setLoggedin', true)
                        resolve(true)
                    } else {
                        commit('setLoggedin', false)
                        resolve(false)
                    }
                })
            })
        }
    },
    modules: {},
    getters: {
        getLoggedIn: state => {
            console.log("Getting state: "+state.logged_in)
            return state.logged_in
        }
    }
})
