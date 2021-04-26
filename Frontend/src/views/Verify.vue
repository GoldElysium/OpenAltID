<template>
  <v-container>
    <DiscordLoginButton></DiscordLoginButton>
  </v-container>
</template>

<script>
// @ is an alias to /src
import DiscordLoginButton from "@/components/DiscordLoginButton";

export default {
  name: 'Verify',
  components: {
    DiscordLoginButton
  },
  mounted() {
    console.log(this.$route.query)
  }
}
</script>

<style>
.iframe-container {
  position: relative;
  overflow: hidden;
  flex: auto;
}

</style>
