package zw.co.dial.technician.evidence

/**
 * CameraX evidence capture contract. Real CameraX bind happens when CAMERA
 * permission is granted; until then callers pass a payloadRef from the picker.
 */
object EvidenceCapture {
    const val CAMERA_PERMISSION = "android.permission.CAMERA"

    @JvmStatic
    fun payloadRefForJob(jobId: String): String = "camx://job/$jobId"
}
