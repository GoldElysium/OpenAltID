<template>
    <h1>SUCCESS, YOU SHOULD BE REDIRECTED!</h1>
</template>

<script>
export default {
    name: "DiscordRedirect",
    mounted() {
        console.log("Redirect Page: ")
        console.log(this.$route.query.code)
        console.log(this.$store.getters.getLoggedIn)
        if (this.$route.query.code && !this.$store.getters.getLoggedIn) {
            this.$store.dispatch('login', this.$route.query.code).then((success) => {
                console.log("Success from the dispatch: " + success)
                if (success) {
                    this.$router.push("/dashboard")
                } else {
                    console.log("FAILURE")
                    this.$router.push("/verify")
                }
            })
        } else {
            this.$router.push("/dashboard")
        }
    }
}
</script>

<style scoped>

</style>