package zw.co.dial.delivery.maps

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class MapLayoutDecisionsTest {
    @Test
    fun neverSetStyleAtZeroSize() {
        assertTrue(MapLayoutDecisions.shouldWaitForMapLayout(0, 0, 0))
        assertFalse(MapLayoutDecisions.shouldWaitForMapLayout(320, 240, 0))
        assertFalse(MapLayoutDecisions.shouldWaitForMapLayout(0, 0, 24))
    }

    @Test
    fun loopbackFallsBackToOpenFreeMap() {
        assertEquals(
            MapLayoutDecisions.OPENFREEMAP_LIBERTY,
            MapLayoutDecisions.resolveStyleUrl("http://127.0.0.1:8081/style.json"),
        )
    }
}
