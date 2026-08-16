pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "dial-technician-android"

include(":app")
include(":core:network")
include(":core:maps")
project(":core:maps").projectDir = file("../delivery-android/core/maps")
