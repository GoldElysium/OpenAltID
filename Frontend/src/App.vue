<template>
    <v-app dark>
        <v-app-bar app>
            <v-app-bar-title>
                OpenAD
            </v-app-bar-title>
            <v-spacer></v-spacer>
            <v-toolbar-items class="align-center">
                <DiscordLoginButton></DiscordLoginButton>
                <div class="pa-2" v-if="this.$route.name === 'Dashboard' && !this.$store.getters.getLoggedIn">
                    <v-btn
                        disabled
                        elevation="2"
                        large
                        raised
                        to="Dashboard"
                    >
                        Dashboard
                    </v-btn>
                </div>
                <div class="pa-2" v-else>
                    <v-btn
                            elevation="2"
                            large
                            raised
                            to="Dashboard"
                    >
                        Dashboard
                    </v-btn>
                </div>
            </v-toolbar-items>
        </v-app-bar>
        <v-main>
            <router-view></router-view>
        </v-main>
        <v-footer>
            <h5>Created by Irony4D</h5>
        </v-footer>
    </v-app>
</template>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
<script>
//import Home from "@/views/Home";
import DiscordLoginButton from "@/components/DiscordLoginButton";

export default {
    components: {DiscordLoginButton},
}
</script>