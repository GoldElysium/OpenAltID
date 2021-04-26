<template>
  <v-app dark>
    <v-app-bar app>
      <v-app-bar-title>
        OpenAD
      </v-app-bar-title>
      <v-menu>

      </v-menu>
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
export default {
  //components: {Home}
}
</script>