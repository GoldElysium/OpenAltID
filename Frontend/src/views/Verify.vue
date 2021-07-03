<template>
    <div class="h-100 d-flex justify-content-center align-items-center flex-fill">
            <b-card
                    style="max-width: 20rem;"
                    v-if="!$store.getters.getLoggedIn"
            >
                <b-card-header>
                    You must login first.
                </b-card-header>
                <h3>Click the button below to login with your Discord account.</h3>
                <discord-login-button></discord-login-button>
            </b-card>
            <b-jumbotron v-else>
                <template #lead>YOU SHOULD BE REDIRECTED!</template>
            </b-jumbotron>
    </div>
</template>

<script>
import DiscordLoginButton from "@/components/discordloginbutton";
export default {
    name: 'Verify',
    components: {
        DiscordLoginButton
    },
    mounted() {
        this.$cookies.set("identifier", this.$route.params.identifier, "1h")
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
