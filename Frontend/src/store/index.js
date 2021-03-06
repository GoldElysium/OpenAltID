import Vue from 'vue'
import Vuex from 'vuex'
import Cookies from 'js-cookie'
import axios from "axios";

Vue.use(Vuex)

let BACKEND_API_BASEURI = process.env.VUE_APP_API_HOST
export default new Vuex.Store({
    state: {
        BACKEND_API_BASEURI: BACKEND_API_BASEURI,
        logged_in: false,
        token: Cookies.get('token') || '',
        siteTitle: ""
    },
    mutations: {
        setToken: (state, token) => {
            Cookies.set('token', token, {secure: true, sameSite: 'lax'})
            state.token = token
        },
        setLoggedin: (state, status) => {
            state.logged_in = status
        }
    },
    actions: {
        login({commit}, urlQuery) {
            return new Promise((resolve, reject) => {
                let token
                axios.post(`${BACKEND_API_BASEURI}/auth/discord/callback?code=${urlQuery.code}`,
                    {
                        body: JSON.stringify({
                            "urlQuery": urlQuery,
                        })
                    }, {
                        withCredentials: true
                    }).then((response => {
                    if (response.status === 200) {
                        commit('setToken', token, true)
                        commit('setLoggedin', true)
                        resolve(true)
                    } else {
                        commit('setToken', '', false)
                        resolve(false)
                    }
                })).catch((error) => {
                    console.error(error)
                    reject(error)
                })
            })
        },
        verifyLogin({commit}) {
            return new Promise((resolve, reject) => {
                if (!this.state.logged_in) {
                    axios.get(`${BACKEND_API_BASEURI}/user/is-logged-in`,
                        {
                            withCredentials: true
                        }).then(response => {
                        if (response.status === 200) {
                            if (response.data.logged_in) {
                                commit('setLoggedin', true)
                                resolve(true)
                            } else {
                                commit('setLoggedin', false)
                                resolve(false)
                            }
                        } else {
                            commit('setLoggedin', false)
                            resolve(false)
                        }
                    }).catch((error) => {
                        console.error(error)
                        reject(error)
                    })
                }
            })
        }
    },
    modules: {},
    getters: {
        getLoggedIn: (state) => {
            return state.logged_in
        }
    }
});