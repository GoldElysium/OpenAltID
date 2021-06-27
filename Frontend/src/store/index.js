import Vue from 'vue'
import Vuex from 'vuex'
import Cookies from 'js-cookie'


Vue.use(Vuex)

let BACKEND_API_BASEURI = process.env.VUE_APP_API_HOST

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
        login({commit}, urlQuery) {
            return new Promise((resolve) => {
                let token
                console.log(BACKEND_API_BASEURI + "/auth/discord/callback?code=" + urlQuery.code)
                fetch(BACKEND_API_BASEURI + "/auth/discord/callback?code=" + urlQuery.code, {
                    method: "post",
                    credentials: "include",
                    body: JSON.stringify({
                        "urlQuery": urlQuery,
                    })
                }).then((response) => {
                    console.log(response)
                    if (response.status === 200) {
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

                if (!this.state.logged_in) {
                    fetch(BACKEND_API_BASEURI + "/user/is-logged-in", {
                        credentials: "include"
                    }).then(response => response.json()).then(response_json => {
                        console.log(response_json)
                        if (response_json.logged_in === true) {
                            commit('setLoggedin', true)
                            resolve(true)
                        } else {
                            commit('setLoggedin', false)
                            resolve(false)
                        }
                    }).catch(error => {
                        console.log(error)
                    })
                } else {
                    resolve(true)
                }
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
