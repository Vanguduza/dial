package zw.co.dial.delivery.location

/**
 * Foreground location pipeline contract — posts courier_locations via gateway.
 * Bound from DeliveryApp; does not use Google Play location as map SoR.
 */
class CourierLocationPipeline(
    private val post: (lat: Double, lng: Double) -> Unit,
) {
    fun onFix(lat: Double, lng: Double) {
        if (!lat.isFinite() || !lng.isFinite()) return
        post(lat, lng)
    }
}
