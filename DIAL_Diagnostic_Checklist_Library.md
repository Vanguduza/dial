# DIAL Diagnostic Checklist Library — v1.0

**Companion to `DIAL_Build_Blueprint_and_Cursor_Prompt.md` §4.** This file is the full, launch-ready content for `packages/checklists` — not a sample. Every entry uses the `DiagnosticChecklist`/`ChecklistStep` schema defined in Build Blueprint §4.1 (extended `trade` union: `automotive | auto_electrical | plumbing | electrical | appliance_hvac | cleaning | beauty | nail_tech | general`), is original content authored for DIAL (never derived from a licensed third-party source — see Build Blueprint §3.7's iFixit licence trap), and is tagged `authoredBy: 'ops_human'`, `status: 'approved'` as a first-pass launch set for the catalogue/ops lead (v4 §8.2) to sanity-check against real Harare pricing before go-live.

**How to read each entry:** a numbered step table (`Instruction` / `Safe self-help?` / `Escalate or branch`), followed by `Likely parts or materials` (confidence-weighted, feeds §5.3's estimation model, never a price itself), `Estimated time`, `Danger flags`, and `requiresProfessionalDefault`. For the three service-intake trades (cleaning, beauty, nail_tech — see Build Blueprint §4.3), steps are intake questions rather than fault branches, and `requiresProfessionalDefault` is marked `n/a` because these are always booked services, never a self-help branch.

**Hard rule carried from v4 §5.15 throughout:** no step ever instructs a customer to handle live electrics, open a pressurised/hot system, work on brakes, handle refrigerant, or take any action beyond a single cautious breaker reset. Observation, recall and containment are the ceiling for "safe self-help" in every checklist below.

**Ops/safety note:** ERP AuthN/AuthZ, webhooks, and secrets remain in `DIAL_Consolidated_Plan_v4.md` + `DIAL_Development_Agent_Pack.md` (+ **D-47** Cursor rules) — this library does not redefine them.

---

## Library index

| # | ID | Trade | Symptom | Key danger flags | Est. time |
| --- | --- | --- | --- | --- | --- |
| 1 | `auto.wont_start.v1` | automotive | Engine won't start | — (escalates on smell/smoke) | 30–75 min |
| 2 | `auto.overheating.v1` | automotive | Engine overheating | `pressurised_hot_system` | 45–60 min |
| 3 | `auto.warning_light.v1` | automotive | Dashboard warning light on | routes to red-light emergencies | 30–45 min |
| 4 | `auto.brake_noise.v1` | automotive | Brake noise / pulls when braking | `brakes` | 45–105 min |
| 5 | `auto.unusual_noise.v1` | automotive | Unusual noise while driving | `brakes` (wheel-area grind) | 45–60 min |
| 6 | `auto.stalling.v1` | automotive | Stalling / rough idle | urgent if stalls in traffic | 45–60 min |
| 7 | `auto.poor_fuel_economy.v1` | automotive | Poor fuel economy | — | 30–45 min |
| 8 | `auto.exhaust_smoke.v1` | automotive | Smoke from exhaust | emergency if thick white + overheating | 45–60 min |
| 9 | `auto.fluid_leak.v1` | automotive | Fluid leak under vehicle | `fuel_leak` | 30–45 min |
| 10 | `auto.pulling_vibration.v1` | automotive | Vehicle pulls/vibrates while driving | — | 45–60 min |
| 11 | `auto.clutch_gearbox.v1` | automotive | Manual clutch/gearbox trouble | — | 60–90 min |
| 12 | `auto.auto_transmission.v1` | automotive | Automatic transmission trouble | — | 60–90 min |
| 13 | `auto.flat_tyre.v1` | automotive | Flat tyre / puncture (roadside) | `roadside_unsafe_location` | 20–45 min |
| 14 | `autoelec.battery.v1` | auto_electrical | Battery won't hold charge | — | 30–45 min |
| 15 | `autoelec.charge_warning.v1` | auto_electrical | Alternator/charge warning light | `stall_risk_while_driving` | 45–60 min |
| 16 | `autoelec.lights.v1` | auto_electrical | Lights not working | brake-light urgency advisory | 20–60 min |
| 17 | `autoelec.central_locking.v1` | auto_electrical | Central locking/windows dead | — | 30–60 min |
| 18 | `autoelec.dash_gremlins.v1` | auto_electrical | Multiple/erratic warning lights | — | 45–60 min |
| 19 | `hvac.ac_not_cooling.v1` | appliance_hvac | AC not cooling (auto) | `gas_refrigerant_handling` | 60–90 min |
| 20 | `hvac.ac_intermittent_smell.v1` | appliance_hvac | AC intermittent / smell from vents | `burning_chemical_smell` | 45–60 min |
| 21 | `plumb.no_hot_water.v1` | plumbing | No hot water | `electrics_under_load`, `gas_lpg` | 45–90 min |
| 22 | `plumb.leak.v1` | plumbing | Leaking tap or pipe | `water_near_electrics` | 30–60 min |
| 23 | `plumb.blocked_drain.v1` | plumbing | Blocked drain/sink | — | 30–90 min |
| 24 | `plumb.blocked_toilet.v1` | plumbing | Blocked/overflowing toilet | `overflow_in_progress` | 30–45 min |
| 25 | `plumb.low_pressure.v1` | plumbing | Low water pressure | — | 30–45 min |
| 26 | `plumb.burst_pipe.v1` | plumbing | Burst pipe | `active_flooding`, `water_near_electrics` | emergency SLA |
| 27 | `plumb.no_water.v1` | plumbing | No water supply at all | — | 30–45 min |
| 28 | `elec.socket_dead.v1` | electrical | Socket/circuit not working | `electrics_under_load` | 30–60 min |
| 29 | `elec.breaker_tripping.v1` | electrical | Breaker tripping repeatedly | `electrics_under_load` | 30–60 min |
| 30 | `elec.lights_flicker.v1` | electrical | Lights flickering or out | — | 30–60 min |
| 31 | `elec.no_power_whole.v1` | electrical | No power to whole property | `electrics_under_load` | 30–45 min |
| 32 | `elec.burning_smell.v1` | electrical | Burning smell / sparking | `fire_risk`, `electrics_under_load` | emergency SLA |
| 33 | `appliance.fridge.v1` | appliance_hvac | Fridge/freezer not cooling | — | 45–60 min |
| 34 | `appliance.washer.v1` | appliance_hvac | Washer not draining/spinning | — | 45–60 min |
| 35 | `appliance.stove.v1` | appliance_hvac | Stove/oven not heating | `gas_lpg` | 45–60 min |
| 36 | `clean.residential_intake.v1` | cleaning | Residential/office cleaning intake | — | 2–5 hrs |
| 37 | `clean.deep_intake.v1` | cleaning | Post-construction/deep-clean intake | `construction_site_hazards` | 4–8 hrs |
| 38 | `beauty.hair_intake.v1` | beauty | Hair service intake | `chemical_allergy_unconfirmed` | 30 min–5 hrs |
| 39 | `beauty.home_visit_intake.v1` | beauty | Home-visit grooming/beauty intake | `medical_contraindication_unconfirmed` | 30–90 min |
| 40 | `nail.intake.v1` | nail_tech | Nail service intake & hygiene | `open_wound_or_infection` | 20–90 min |
| 41 | `general.triage_router.v1` | general | "Something's broken" triage router | escalates to #42 anytime | n/a |
| 42 | `emergency.triage.v1` | general | Emergency triage (fire/gas/electrical/flood/accident) | all emergency flags | emergency SLA |

---

## Automotive (mechanical) — 13

### 1. `auto.wont_start.v1` — Engine won't start

The highest-frequency automotive diagnostic and the template the rest follow.

| Step | Instruction | Safe self-help? | Escalate / branch |
| --- | --- | --- | --- |
| 1 | Do the dashboard lights come on when you turn the key/press start? | Yes (observation only) | Yes → 2; No → 5 |
| 2 | Does the engine crank (spin/turn) but not start? | Yes (observation) | Yes → 3; No → 4 |
| 3 | Cranks but won't start — is the fuel tank empty or near-empty? | Yes (visual gauge check only) | Empty → self-help "add fuel, retry"; not empty → likely ignition/fuel-delivery/sensor fault |
| 4 | No crank at all — are dashboard lights dim or flickering when you try to start? | Yes (observation only) | Dim/flicker → likely battery/terminals; steady lights, no crank → likely starter motor |
| 5 | No dashboard lights at all — are battery terminals visibly connected, without obvious corrosion? **Do not touch or clean terminals** | Yes (visual only, never handle terminals) | Always → book diagnostic call-out; corrosion/smell/case swelling → mark urgent |
| 6 (always shown) | **Never** jump-start, open the bonnet near a suspected fuel leak, or continue if you smell fuel or see smoke | N/A — safety notice | Smoke/fuel smell → `emergency.triage` |

**Likely parts:** battery (0.35), starter motor (0.2), alternator (0.15), ignition switch (0.1), fuel pump/relay (0.1), other (0.1).
**Estimated time:** diagnostic 30–45 min; +20–30 min if battery replacement confirmed on-site.
**Danger flags:** none at self-help stage; escalates to `electrics_under_load` once a technician works the starter circuit live.
**requiresProfessionalDefault:** true.

### 2. `auto.overheating.v1` — Engine overheating

| Step | Instruction | Safe self-help? | Escalate / branch |
| --- | --- | --- | --- |
| 1 | Is the gauge hot, or steam/smoke from the bonnet **right now**? | Yes (observation) | Steam/smoke now → `emergency.triage`, stop driving immediately |
| 2 | If not overheating now but it happened recently — has coolant level been checked **only when the engine is cold**? | Yes — checking only, never opening a hot system | Any mention of opening a warm/hot cap/reservoir → hard stop, safety notice |
| 3 | Any coolant puddle visible under the vehicle when parked? | Yes (observation only) | Weights likely-parts toward radiator/hose vs. water pump |
| 4 | Has the vehicle been driven since the overheating event? | Yes | Yes + no repair yet → mark urgent, discourage further driving |

**Likely parts:** thermostat (0.25), radiator/hose (0.25), water pump (0.2), head gasket — high severity, ops-flag (0.1), coolant top-up only (0.2).
**Estimated time:** 45–60 min (wider than "won't start" — genuinely more variable).
**Danger flags:** `pressurised_hot_system` — never instruct opening a cap/reservoir while warm.
**requiresProfessionalDefault:** true.

### 3. `auto.warning_light.v1` — Dashboard warning light on

| Step | Instruction | Safe self-help? | Escalate / branch |
| --- | --- | --- | --- |
| 1 | Is the light red, or orange/yellow? | Yes (observation) | Red → treat with urgency, minimize further driving |
| 2 | Is it the check-engine symbol, or a different one (battery, oil-can, temperature, brake "!")? | Yes (observation) | Battery → `autoelec.charge_warning`; temperature → `auto.overheating`; brake → `auto.brake_noise`; oil-can (red) → escalate directly, stop driving |
| 3 | If check-engine (orange) with no other symptom (no smoke, no rough running, no smell) — is the fuel cap fully closed and clicked? | Yes — single safe check | Resolves light after a drive cycle in many vehicles; if not, book diagnostic scan |
| 4 | If red oil-pressure or brake-system light — stop driving as soon as it is safe to do so | N/A — safety notice | Always escalates toward urgent booking |

**Likely parts:** genuinely requires an OBD-II scan to narrow — "diagnostic scan required" (0.5) rather than a guessed part; emissions sensor/fuel cap (0.2, orange-only, self-resolving case).
**Estimated time:** scan + diagnosis 30–45 min.
**Danger flags:** routes to `emergency.triage` only via the red oil/brake branches.
**requiresProfessionalDefault:** true (except the fuel-cap self-check).

### 4. `auto.brake_noise.v1` — Brake noise or vehicle pulls when braking

| Step | Instruction | Safe self-help? | Escalate / branch |
| --- | --- | --- | --- |
| 1 | Is the noise a squeal/screech, or a grinding/metal-on-metal sound? | Yes (observation) | Squeal → early wear-indicator, still short-term safe; grinding → escalate immediately |
| 2 | Does the vehicle pull to one side when braking, or does the pedal feel different (spongy, needs pumping, goes toward the floor)? | Yes (observation) | Spongy/floor-pedal → brake fluid/line issue, treat as urgent, discourage driving |
| 3 | Any brake warning light on the dashboard? | Yes | → `auto.warning_light` red-light branch |

**Likely parts:** pads (0.4), rotors/discs (0.25), calipers (0.15), brake fluid/lines (0.15), wheel bearing — grinding+pulling combo (0.05).
**Estimated time:** 45–60 min diagnostic; +30–45 min if pad/rotor replacement confirmed same visit.
**Danger flags:** `brakes` on every branch, always — no self-help beyond observation, ever.
**requiresProfessionalDefault:** true, always.

### 5. `auto.unusual_noise.v1` — Unusual noise while driving

| Step | Instruction | Safe self-help? | Escalate / branch |
| --- | --- | --- | --- |
| 1 | Where does it seem to come from — engine bay, underneath, or the wheels? | Yes (observation) | Routes likely-parts weighting |
| 2 | Does it change with engine speed (revving in neutral) or with road speed/steering? | Yes | Revving-linked → belt/pulley; speed-linked → bearing/CV joint/tyre |
| 3 | Is it a knock, squeal, grinding, clunk, or hiss? | Yes | Knock under load → possible drivetrain, ops-flag high severity |
| 4 | Any dashboard warning light with it? | Yes | → `auto.warning_light` |

**Likely parts:** belt/pulley (0.2), CV joint/driveshaft (0.15), wheel bearing (0.15), exhaust mount/heat shield rattle (0.15), suspension bush/strut (0.2), engine internal — high severity, ops-flag (0.15).
**Estimated time:** 45–60 min (genuinely wide — noise diagnosis varies a lot).
**Danger flags:** `brakes` if the noise is a grind specifically from the wheel area.
**requiresProfessionalDefault:** true.

### 6. `auto.stalling.v1` — Stalling / rough idle

| Step | Instruction | Safe self-help? | Escalate / branch |
| --- | --- | --- | --- |
| 1 | Does it stall only at idle/stopped, or also while driving? | Yes | While driving → mark urgent (loss of power in traffic) |
| 2 | Happens more when cold (just started) or once warmed up? | Yes | Warm-only shifts weighting toward sensor/fuel vs. cold-only idle-control faults |
| 3 | Any recent fuel fill-up, or running low on fuel recently? | Yes (recall) | Feeds fuel-quality/contamination weighting |
| 4 | Any warning lights? | Yes | → `auto.warning_light` |

**Likely parts:** idle air control valve/throttle body (0.2), spark plugs/ignition coils (0.2), fuel filter/pump (0.2), MAF/O2 sensor (0.2), fuel contamination (0.2).
**Estimated time:** 45–60 min.
**Danger flags:** stalling while driving in traffic → treat as urgent, not routine.
**requiresProfessionalDefault:** true.

### 7. `auto.poor_fuel_economy.v1` — Poor fuel economy

| Step | Instruction | Safe self-help? | Escalate / branch |
| --- | --- | --- | --- |
| 1 | Gradual over weeks, or sudden after one trip/event? | Yes (recall) | Sudden → check for an accompanying fault (warning light, rough running) |
| 2 | Any warning lights on? | Yes | → `auto.warning_light` |
| 3 | Tyre pressure checked against the door-sill placard recently? | Yes — safe, standard self-help | Resolves a real share of cases on its own |
| 4 | Driving pattern changed recently (more short trips/traffic/AC use)? | Yes (recall) | Sets expectations; not necessarily a fault |

**Likely parts:** tyre pressure (0.15, self-correctable), air filter (0.15), spark plugs (0.2), fuel injectors/O2 sensor (0.25), wheel alignment (0.1), driving pattern only, no fault (0.15).
**Estimated time:** 30–45 min diagnostic.
**Danger flags:** none — low-urgency, non-safety checklist.
**requiresProfessionalDefault:** false only if the tyre-pressure self-check resolves it; true otherwise.

### 8. `auto.exhaust_smoke.v1` — Smoke from exhaust

| Step | Instruction | Safe self-help? | Escalate / branch |
| --- | --- | --- | --- |
| 1 | What colour — white, blue, or black? | Yes (observation) | Thin white at cold start only, fading as engine warms → often just condensation |
| 2 | Constant, only at startup, or only under acceleration? | Yes | Persistent thick white with a sweet smell → escalate as urgent (possible head gasket) |
| 3 | Any loss of power, overheating, or unusual smell with it? | Yes | Coolant-sweet smell + smoke → `auto.overheating`, treat as urgent |

**Likely parts:** valve seals/piston rings — blue smoke (0.3), head gasket — thick white/sweet (0.2), fuel injectors/turbo — black smoke (0.25), condensation only, no fault (0.25).
**Estimated time:** 45–60 min.
**Danger flags:** thick white/sweet-smelling smoke with overheating → `emergency.triage` consideration.
**requiresProfessionalDefault:** true, unless clearly cold-morning condensation only.

### 9. `auto.fluid_leak.v1` — Fluid leak under vehicle

| Step | Instruction | Safe self-help? | Escalate / branch |
| --- | --- | --- | --- |
| 1 | Colour of the fluid — clear/light, green/orange/pink, dark red/brown, red, or clear-yellow with a strong smell? | Yes (observation) | Clear-yellow + strong smell → fuel, treat as hazard |
| 2 | Where under the vehicle — front, middle, or rear? | Yes | Weights likely-parts |
| 3 | Fuel smell or active dripping right now? | Yes | → `emergency.triage` if strong fuel smell/active dripping |
| 4 | Photo of the puddle and the area above it | Yes (guided photo capture) | Feeds `photoOverlayIds` |

**Likely parts:** coolant hose/radiator (0.25), engine oil seal/gasket (0.25), AC condensation, no fault (0.15), transmission/power-steering seal (0.15), fuel line/tank — hazard (0.2).
**Estimated time:** 30–45 min diagnostic.
**Danger flags:** `fuel_leak` — no self-help beyond moving away from the vehicle and not starting the engine.
**requiresProfessionalDefault:** true, except confirmed harmless AC condensation.

### 10. `auto.pulling_vibration.v1` — Vehicle pulls or vibrates while driving

| Step | Instruction | Safe self-help? | Escalate / branch |
| --- | --- | --- | --- |
| 1 | Pulls constantly, only under braking, or only under acceleration? | Yes | Under braking → `auto.brake_noise` |
| 2 | Vibrates at a specific speed, or constantly regardless of speed? | Yes | Specific-speed → tyre/balance; constant → alignment/suspension/CV joint |
| 3 | Recent pothole impact, tyre change, or new tyres fitted? | Yes (recall) | Feeds likely-parts |
| 4 | Uneven tyre wear visible? | Yes (visual check only) | Feeds likely-parts |

**Likely parts:** wheel alignment (0.25), tyre balance (0.2), suspension component (0.2), CV joint/driveshaft (0.2), tyre wear/damage (0.15).
**Estimated time:** 45–60 min.
**Danger flags:** vibration worsening over time → treat as urgent (risk of component failure while driving).
**requiresProfessionalDefault:** true.

### 11. `auto.clutch_gearbox.v1` — Manual clutch/gearbox trouble

| Step | Instruction | Safe self-help? | Escalate / branch |
| --- | --- | --- | --- |
| 1 | Difficulty/grinding changing gear, pedal feels different (high bite point, spongy, floors out), or clutch "slips" (revs rise without matching speed)? | Yes (observation) | Routes likely-parts |
| 2 | Started gradually or suddenly? | Yes (recall) | Sudden onset weighted differently |
| 3 | Burning smell, especially in traffic/hill starts? | Yes (observation) | Escalate as urgent — clutch plate near failure |
| 4 | Fluid leak near the clutch pedal/firewall area (hydraulic clutch)? | Yes (observation) | → `auto.fluid_leak`, note clutch-hydraulic |

**Likely parts:** clutch/pressure plate (0.35), clutch hydraulic (master/slave cylinder) (0.2), gearbox synchro/bearing (0.25), cable/linkage — cable-clutch vehicles (0.2).
**Estimated time:** 60–90 min diagnostic — gearbox work runs longer than most automotive jobs.
**Danger flags:** none beyond a general "don't keep driving as it worsens" advisory.
**requiresProfessionalDefault:** true.

### 12. `auto.auto_transmission.v1` — Automatic transmission trouble

| Step | Instruction | Safe self-help? | Escalate / branch |
| --- | --- | --- | --- |
| 1 | Hesitates/slips between gears, refuses to shift out of one gear, or delays engaging Drive/Reverse? | Yes (observation) | Routes likely-parts |
| 2 | Any warning light (often transmission-specific or check-engine)? | Yes | → `auto.warning_light` |
| 3 | Burning smell, or transmission fluid leak? | Yes | → `auto.fluid_leak`, note transmission |
| 4 | When was transmission fluid last serviced, if known? | Yes (recall only — never instruct checking level on a running transmission) | Feeds likely-parts |

**Likely parts:** fluid condition/level (0.2), solenoid pack (0.25), torque converter (0.2), transmission control module/sensor (0.2), internal wear — high severity, ops-flag (0.15).
**Estimated time:** 60–90 min diagnostic.
**Danger flags:** slipping on hills/highway → general roadworthiness advisory.
**requiresProfessionalDefault:** true.

### 13. `auto.flat_tyre.v1` — Flat tyre / puncture (roadside)

| Step | Instruction | Safe self-help? | Escalate / branch |
| --- | --- | --- | --- |
| 1 | Is the vehicle in a safe location off the road with hazards on, or still on an active road/highway? | Yes (observation) | Unsafe location → `emergency.triage` roadside path first, diagnosis second |
| 2 | Visible nail/object in the tyre, a sidewall bulge/tear, or no obvious cause? | Yes (observation) | Sidewall damage → not repairable, needs replacement |
| 3 | Spare wheel and jack present — DIY-swap guidance wanted, or mobile fitment preferred? | Optional self-help — standard practice, not on the "never DIY" list; mobile fitment remains the default | Customer choice, always offered as an option not a requirement |
| 4 | Confirm tyre size/spec from the sidewall (photo capture) | Yes (guided photo capture) | Ensures correct replacement/loaner dispatched |

**Likely parts:** tyre replacement (0.5, sidewall/unrepairable), puncture repair (0.4, tread nail), valve stem (0.1).
**Estimated time:** 20–30 min roadside repair; 30–45 min replacement/mobile fitment.
**Danger flags:** `roadside_unsafe_location` — forces immediate deterministic dispatch, checklist pauses.
**requiresProfessionalDefault:** false for the optional DIY spare-swap guidance only; true for repair/replacement work itself.

---

## Auto-electrical — 5

### 14. `autoelec.battery.v1` — Battery won't hold charge / keeps dying

| Step | Instruction | Safe self-help? | Escalate / branch |
| --- | --- | --- | --- |
| 1 | Fails every time, or only after sitting unused a day or more? | Yes | Every time → `auto.wont_start` instead |
| 2 | Battery age, if known? | Yes (recall) | Feeds likely-parts |
| 3 | Any interior light, alarm, or accessory left on before it sat unused? | Yes (recall) | Feeds parasitic-drain weighting |
| 4 | Dim headlights or slow crank noticed just before it died? | Yes (observation) | Feeds likely-parts |

**Likely parts:** battery (0.5), parasitic drain — light/alarm/accessory (0.2), alternator not fully charging it (0.2), corroded terminal connection (0.1).
**Estimated time:** 30–45 min.
**Danger flags:** none at self-help stage (recall/observation only) — never instruct testing/charging/jump-starting.
**requiresProfessionalDefault:** true.

### 15. `autoelec.charge_warning.v1` — Alternator/charge warning light

| Step | Instruction | Safe self-help? | Escalate / branch |
| --- | --- | --- | --- |
| 1 | Is the battery-shaped light on now, and did it come on suddenly while driving? | Yes (observation) | Feeds urgency |
| 2 | Dimming headlights/dash lights, or sluggish accessories (radio, windows)? | Yes (observation) | Feeds likely-parts |
| 3 | Squealing noise from the engine bay? | Yes (observation) | Points toward drive belt |
| 4 | How much further driving is planned today? | Yes | Advise minimizing further driving — battery-only power can affect assist systems on some vehicles |

**Likely parts:** alternator (0.4), drive belt (0.2), voltage regulator (0.15), wiring/connector fault (0.15), battery — secondary cause (0.1).
**Estimated time:** 45–60 min.
**Danger flags:** `stall_risk_while_driving` — advise against continuing a long trip.
**requiresProfessionalDefault:** true.

### 16. `autoelec.lights.v1` — Lights not working (head/indicator/brake)

| Step | Instruction | Safe self-help? | Escalate / branch |
| --- | --- | --- | --- |
| 1 | Which lights — headlights (one/both), indicators, brake lights, or all? | Yes (observation) | Routes likely-parts |
| 2 | One side only, and was a bulb recently replaced? | Yes (recall) | Feeds likely-parts |
| 3 | Indicators fast-blinking or silent-clicking? | Yes (observation) | Classic bulb-out symptom on many vehicles — noted, not self-fixed (access varies) |
| 4 | ALL lights out simultaneously (head, brake, indicators)? | Yes (observation) | Likely fuse/wiring, not a bulb — escalate directly |

**Likely parts:** bulb (0.4, single-light cases), fuse (0.25), wiring/connector/switch (0.2), relay (0.15).
**Estimated time:** 20–30 min for a bulb; 45–60 min if fuse/wiring.
**Danger flags:** brake lights out → advise avoiding driving until fixed (rear-collision risk).
**requiresProfessionalDefault:** true — bulb replacement stays a booked visit, keeping parity with the "book, don't guess" default.

### 17. `autoelec.central_locking.v1` — Central locking / power windows not working

| Step | Instruction | Safe self-help? | Escalate / branch |
| --- | --- | --- | --- |
| 1 | One door/window only, or all of them? | Yes (observation) | Routes likely-parts |
| 2 | Does the key fob respond at all (lights flash, click), or nothing? | Yes (observation) | Feeds likely-parts |
| 3 | Fob battery replaced recently, or known low? | Yes — genuinely safe, common self-help | Often resolves it directly |
| 4 | Power window — any motor sound when the switch is pressed, or silent? | Yes (observation) | Silent → fuse/relay/wiring; sound-but-no-movement → motor/regulator |

**Likely parts:** key fob battery (0.2, self-resolvable), door lock actuator (0.25), window motor/regulator (0.25), fuse/relay (0.15), door-hinge wiring loom — common failure point (0.15).
**Estimated time:** 30–45 min single door; 45–60 min central fault.
**Danger flags:** none — low-safety-risk category.
**requiresProfessionalDefault:** false only if the fob-battery self-help resolves it; true otherwise.

### 18. `autoelec.dash_gremlins.v1` — Multiple/erratic warning lights or gauges

| Step | Instruction | Safe self-help? | Escalate / branch |
| --- | --- | --- | --- |
| 1 | Several lights on at once, or gauges reading incorrectly/jumping? | Yes (observation) | Feeds likely-parts |
| 2 | Started suddenly, and correlates with anything (recent battery work, jump-start, new accessory)? | Yes (recall) | Feeds likely-parts |
| 3 | Any other electrical symptom at the same time? | Yes | Cross-reference `autoelec.battery`, `autoelec.charge_warning` |

**Likely parts:** battery/alternator voltage instability (0.3), grounding fault (0.25), instrument cluster/wiring (0.2), aftermarket accessory interference (0.15), sensor fault feeding multiple systems (0.1).
**Estimated time:** 45–60 min — genuinely needs a scan tool, not guesswork.
**Danger flags:** none directly, but never let the customer dismiss this pattern as cosmetic — it often masks a real underlying fault.
**requiresProfessionalDefault:** true.

---

## Automotive HVAC — 2

### 19. `hvac.ac_not_cooling.v1` — Air conditioning not cooling

Deliberately intersects the **restricted-SKU rule** in v4 §7.9/D-15a: refrigerant may not be sold to, or handled on behalf of, a customer without a certified technician.

| Step | Instruction | Safe self-help? | Escalate / branch |
| --- | --- | --- | --- |
| 1 | Blowing air but not cold, or not blowing at all? | Yes | Not blowing at all → possible blower motor/fuse, not refrigerant |
| 2 | Unusual smell or hissing sound when AC is on? | Yes (observation) | Hissing → possible refrigerant leak — **no DIY refrigerant top-up product, ever** |
| 3 | (System note, not customer-facing) Regas/refrigerant work requires a National Ozone Office-certified technician | N/A | Always routes to `book_service`, never `self_help_only` |

**Likely parts:** refrigerant — restricted, quote-only, never a direct-add-to-basket SKU per v4 D-15a (weight not applicable as a self-help item), compressor (0.15), condenser (0.1), blower motor/fuse (0.15, "not blowing" branch only).
**Estimated time:** 60–90 min including regas.
**Danger flags:** `gas_refrigerant_handling` — hard-coded to always require a professional; must never reach `requiresProfessional: false` on any branch.
**requiresProfessionalDefault:** true, always.

### 20. `hvac.ac_intermittent_smell.v1` — AC blowing intermittently / smell from vents

| Step | Instruction | Safe self-help? | Escalate / branch |
| --- | --- | --- | --- |
| 1 | Cuts in and out, or never gets cold at all? | Yes | Never-cold → `hvac.ac_not_cooling` |
| 2 | Musty/mildew smell, or something else (burning, chemical)? | Yes (observation) | Burning/chemical → escalate immediately, turn AC off |
| 3 | Airflow strong and consistent, or weak/inconsistent too? | Yes (observation) | Feeds likely-parts |

**Likely parts:** cabin air filter (0.25), evaporator core mould/mildew (0.25), AC clutch/relay cycling fault (0.25), electrical connector fault (0.15), refrigerant charge low — secondary (0.1).
**Estimated time:** 45–60 min.
**Danger flags:** `burning_chemical_smell` → escalate immediately.
**requiresProfessionalDefault:** true — cabin-filter check may be offered as a supervised optional note only, per v4 §5.15's conservative default.

---

## Plumbing — 7

### 21. `plumb.no_hot_water.v1` — No hot water

| Step | Instruction | Safe self-help? | Escalate / branch |
| --- | --- | --- | --- |
| 1 | Electric geyser or gas? | N/A (routing) | Gas → heavier weight toward professional given LPG regulation (v4 §7.9) |
| 2 (electric) | Is the geyser's breaker "on" at the DB board? Look only — **do not reset a breaker that has tripped more than once** | Yes (observation; single reset if it hasn't tripped repeatedly) | Trips again → `requiresProfessional: true`, electrical fault, not just geyser |
| 3 (electric) | Any burning smell near the geyser or DB board? | Yes (observation) | Burning smell → urgent escalation, no re-attempt |
| 4 (gas) | Gas supply present at other appliances (stove, etc.)? | Yes | No gas anywhere → supply issue, not geyser-specific |

**Likely parts:** heating element (0.3), thermostat (0.25), pressure relief valve (0.1), gas control valve — gas only (0.15), wiring/breaker — electrical fault (0.2).
**Estimated time:** 45–90 min, depending on element replacement vs. simple reset.
**Danger flags:** `electrics_under_load` (electric path, beyond one breaker check), `gas_lpg` (gas path).
**requiresProfessionalDefault:** true.

### 22. `plumb.leak.v1` — Leaking tap or pipe

| Step | Instruction | Safe self-help? | Escalate / branch |
| --- | --- | --- | --- |
| 1 | From a tap (dripping/running when off), or a pipe/joint (visible wet patch)? | Yes (observation) | Routes likely-parts |
| 2 | Hot supply, cold, or both? | Yes (observation) | Feeds likely-parts |
| 3 | Can it be temporarily contained (bucket/towel) without touching any fitting? | Yes — containment only, never tightening/loosening a fitting | Standard safe self-help |
| 4 | Worsening quickly, or steady/slow? | Yes (observation) | Fast + near electrics → escalate urgently; isolate at the main stopcock if known |

**Likely parts:** tap washer/cartridge (0.3), pipe joint/fitting (0.3), pipe corrosion/wear (0.2), appliance supply hose (0.2).
**Estimated time:** 30–60 min, depending on access.
**Danger flags:** `water_near_electrics` if near a socket/DB board/appliance.
**requiresProfessionalDefault:** true.

### 23. `plumb.blocked_drain.v1` — Blocked drain/sink

| Step | Instruction | Safe self-help? | Escalate / branch |
| --- | --- | --- | --- |
| 1 | One sink/drain, or several fixtures at once? | Yes (observation) | Multiple at once → likely main-line blockage |
| 2 | Anything poured down recently (grease/food waste), or a chemical drain cleaner already tried? | Yes (recall) | DIAL does not recommend chemical drain cleaner as a self-help step; a plunger on a single sink is acceptable |
| 3 | Any smell, gurgling from other drains, or backing-up at an unexpected fixture? | Yes (observation) | Feeds main-line weighting |

**Likely parts:** trap/P-trap blockage (0.35), main line blockage — multiple fixtures (0.25), grease/debris buildup (0.25), tree root intrusion — older properties (0.15).
**Estimated time:** 30–45 min single fixture; 60–90 min main line (rodding/jetting equipment).
**Danger flags:** none, beyond avoiding a chemical-cleaner recommendation.
**requiresProfessionalDefault:** false only if a single-sink plunger self-help resolves it; true otherwise.

### 24. `plumb.blocked_toilet.v1` — Blocked or overflowing toilet

| Step | Instruction | Safe self-help? | Escalate / branch |
| --- | --- | --- | --- |
| 1 | Currently rising/about to overflow? | Yes (observation) | Stop flushing; close the shut-off valve behind the toilet if known and accessible — safe, standard self-help |
| 2 | Plunger already tried? | Yes — standard safe self-help | Often resolves it directly |
| 3 | Only this toilet blocked, or other drains also slow/backed up? | Yes (observation) | Multiple → `plumb.blocked_drain` main-line weighting |

**Likely parts:** trap blockage (0.4), foreign object (0.2), main line — if multiple fixtures affected (0.25), cistern/flush mechanism fault, not a blockage at all (0.15).
**Estimated time:** 30–45 min.
**Danger flags:** `overflow_in_progress` if water is actively rising.
**requiresProfessionalDefault:** false only if the plunger self-help fully resolves it; true otherwise.

### 25. `plumb.low_pressure.v1` — Low water pressure

| Step | Instruction | Safe self-help? | Escalate / branch |
| --- | --- | --- | --- |
| 1 | Low at one fixture only, or throughout the property? | Yes (observation) | Routes likely-parts |
| 2 | Low on both hot and cold, or one only? | Yes (observation) | Hot-only → geyser-side restriction; both → supply-side |
| 3 | Gradual over weeks, or sudden today? | Yes (recall) | Sudden + whole-property → check municipal supply/neighbours, or route to `plumb.leak`/`plumb.burst_pipe` if severe |
| 4 | Any recent plumbing work on the property? | Yes (recall) | Feeds likely-parts |

**Likely parts:** aerator/tap filter blockage — single fixture (0.2), pressure-limiting valve fault (0.2), geyser-side restriction — hot only (0.2), supply pipe scale/corrosion — older plumbing (0.25), municipal supply issue — no DIAL fault (0.15).
**Estimated time:** 30–45 min diagnostic.
**Danger flags:** none.
**requiresProfessionalDefault:** true — aerator-clean self-help may be offered as a supervised optional step for the single-fixture case.

### 26. `plumb.burst_pipe.v1` — Burst pipe (EMERGENCY)

| Step | Instruction | Safe self-help? | Escalate / branch |
| --- | --- | --- | --- |
| 1 | Water actively flowing/spraying right now? | Yes (observation) | Yes → `emergency.triage` / deterministic dispatch (v4 §3.1) immediately, skip further questions |
| 2 | If the main stopcock/shut-off location is known, close it | Yes — the single highest-value instruction in this checklist, surfaced first | Standard, safe, high-value self-help |
| 3 | Electrics anywhere near the water (sockets, DB board, appliances on the floor)? | Yes (observation) | Stay clear; switch off the relevant breaker from a dry, safe position only, if safe to do so |
| 4 | Location and approximate severity, photo if safe to take | Yes (guided photo capture) | Feeds dispatch prioritisation |

**Likely parts:** not assessed at intake — determined on-site by the responding technician.
**Estimated time:** governed by v4's emergency dispatch SLA, not this document.
**Danger flags:** `active_flooding`, `water_near_electrics` — always emergency priority, never the normal diagnostic/quote flow.
**requiresProfessionalDefault:** true, always — `isPreliminary` is not relevant here; this checklist's only job is safe containment and fast dispatch, never a quote.

### 27. `plumb.no_water.v1` — No water supply at all

| Step | Instruction | Safe self-help? | Escalate / branch |
| --- | --- | --- | --- |
| 1 | No water throughout the property, or just one fixture? | Yes (observation) | One fixture only → `plumb.low_pressure` instead |
| 2 | Do neighbours also have no water? | Yes — safe, zero-risk, often resolves the question immediately | Municipal outage vs. property-specific |
| 3 | Municipal supply, borehole/tank, or a mix? | Yes (recall) | Changes likely cause entirely |
| 4 | Recent plumbing work, or (borehole/tank) a pump that's stopped its normal running sound? | Yes (recall/observation) | Feeds likely-parts |

**Likely parts:** municipal supply outage — no DIAL parts (0.25), pump fault — borehole/tank systems (0.25), main supply pipe blockage/burst (0.2), unpaid account/meter issue — municipal (0.1), tank empty/float valve fault (0.2).
**Estimated time:** 30–45 min diagnostic, assuming not a simple municipal outage.
**Danger flags:** none.
**requiresProfessionalDefault:** true, unless resolved as a confirmed municipal outage via the neighbour check.

---

## Electrical (household) — 5

### 28. `elec.socket_dead.v1` — Socket / circuit not working

| Step | Instruction | Safe self-help? | Escalate / branch |
| --- | --- | --- | --- |
| 1 | One socket, or a whole room/circuit? | N/A (routing) | Whole circuit → DB board fault, higher priority |
| 2 | At the DB board, is the relevant breaker visually "off"? | Yes (observation) | Feeds likely-parts |
| 3 | If tripped — unplug everything on that circuit, then **one** reset attempt is allowed | Yes — one attempt only, never repeated | Trips again → `requiresProfessional: true`, `electrics_under_load`, do not repeat |
| 4 | Scorch marks, smell, or warmth at the socket or DB board? | Yes (observation only — **never touch**) | Any yes → urgent escalation, treat as fire risk |

**Likely parts:** breaker (0.3), socket/wiring fault (0.35), appliance fault on that circuit, not house wiring (0.2), DB board fault (0.15).
**Estimated time:** 30–60 min (DB board faults trend longer — widen once outcome data exists, §6).
**Danger flags:** `electrics_under_load` on every branch past step 2 — never more than one customer-performed breaker reset.
**requiresProfessionalDefault:** true.

### 29. `elec.breaker_tripping.v1` — Breaker tripping repeatedly

| Step | Instruction | Safe self-help? | Escalate / branch |
| --- | --- | --- | --- |
| 1 | Trips immediately on reset, after a few minutes, or only with a specific appliance on? | Yes (observation) | Immediately-on-reset → likely short circuit, no repeat reset |
| 2 | Has this breaker already been reset more than once today? | Yes (recall) | Yes → stop, no further customer resets, escalate directly |
| 3 | Burning smell or warmth at the DB board? | Yes (observation) | → `elec.burning_smell`, treat as emergency |

**Likely parts:** faulty appliance on that circuit (0.3), short circuit in wiring (0.3), breaker itself worn/faulty (0.2), overloaded circuit (0.2).
**Estimated time:** 30–60 min.
**Danger flags:** `electrics_under_load` always; hard ceiling of one customer reset attempt, same rule as `elec.socket_dead`.
**requiresProfessionalDefault:** true.

### 30. `elec.lights_flicker.v1` — Lights flickering or out

| Step | Instruction | Safe self-help? | Escalate / branch |
| --- | --- | --- | --- |
| 1 | One fitting, several on the same circuit, or the whole property? | Yes (observation) | Whole-property flicker → higher priority, possible supply/main-connection issue |
| 2 | Flickers with specific appliances (kettle, aircon) turning on/off, or randomly/constantly? | Yes (observation) | Correlates-with-appliance → real fault (loose connection/voltage drop under load) |
| 3 | Bulb type recently changed (e.g. LED retrofit into an old dimmer/fitting)? | Yes — genuinely common, safe, useful check | Often resolves it directly |

**Likely parts:** bulb/fitting compatibility (0.15, self-resolvable), loose wiring connection (0.3), dimmer switch fault (0.15), DB board/main connection — whole property (0.25), municipal supply fluctuation — no DIAL fault (0.15).
**Estimated time:** 30–45 min single fitting; 45–60 min whole-property.
**Danger flags:** whole-property flicker → note as possible supply fault, moderate urgency.
**requiresProfessionalDefault:** true — bulb-compatibility check is the one safe self-help exception.

### 31. `elec.no_power_whole.v1` — No power to whole property

| Step | Instruction | Safe self-help? | Escalate / branch |
| --- | --- | --- | --- |
| 1 | Do neighbours also have no power? | Yes — safe, zero-risk, often resolves it immediately | Municipal outage/load-shedding vs. property-specific |
| 2 | If neighbours have power — is the main breaker/isolator "on" at the DB board? | Yes (observation; one cautious reset if it is clearly the main switch and hasn't been reset repeatedly) | Feeds likely-parts |
| 3 | Burning smell, or visible damage at the meter/DB board? | Yes (observation) | → `elec.burning_smell`, emergency |
| 4 | Prepaid meter — has it simply run out of credit/tokens? | Yes — genuinely useful, safe, very common real-world cause | Often resolves it directly |

**Likely parts:** municipal outage/load-shedding — no DIAL fault (0.3), prepaid meter out of credit — no fault (0.15), main breaker/isolator fault (0.2), DB board fault (0.2), incoming supply cable fault (0.15).
**Estimated time:** 30–45 min diagnostic once confirmed property-specific.
**Danger flags:** `electrics_under_load` if the main-breaker reset trips again; DB board damage → emergency.
**requiresProfessionalDefault:** true, unless resolved by the outage/meter-credit checks.

### 32. `elec.burning_smell.v1` — Burning smell or visible sparking (EMERGENCY)

| Step | Instruction | Safe self-help? | Escalate / branch |
| --- | --- | --- | --- |
| 1 | Visible sparking, smoke, or an active burning smell right now? | Yes (observation) | → `emergency.triage` / deterministic dispatch (v4 §3.1) immediately, skip further questions |
| 2 | If safe from a dry, clear position — switch off the main breaker/isolator at the DB board | Yes — only if no smoke, standing water, or visible panel damage | Never approach otherwise |
| 3 | Evacuate the immediate area if smoke is present | N/A — safety instruction | Fire-safety situation until confirmed otherwise |

**Likely parts:** not assessed at intake — determined on-site.
**Estimated time:** governed by v4's emergency dispatch SLA.
**Danger flags:** `fire_risk`, `electrics_under_load` — always maximum priority.
**requiresProfessionalDefault:** true, always.

---

## Appliance / general artisan — 3

### 33. `appliance.fridge.v1` — Fridge/freezer not cooling

| Step | Instruction | Safe self-help? | Escalate / branch |
| --- | --- | --- | --- |
| 1 | Fridge section, freezer section, or both not cooling? | Yes (observation) | Routes likely-parts |
| 2 | Compressor humming, or completely silent? | Yes (observation) | Silent → power/thermostat; humming but not cold → refrigerant/compressor/door-seal |
| 3 | Door sealing properly — any gap or food blocking closure? | Yes — safe, common, useful check | Often resolves it directly |
| 4 | Coils behind/underneath visibly dusty/blocked? | Yes (visual only — never instruct moving a large appliance alone) | Feeds likely-parts |

**Likely parts:** door seal/gasket (0.2, self-resolvable if obstruction), thermostat (0.2), condenser coils dirty (0.15, professional clean), compressor (0.2), refrigerant leak (0.15), fan/defrost system (0.1).
**Estimated time:** 45–60 min diagnostic.
**Danger flags:** none.
**requiresProfessionalDefault:** true, except the door-seal-obstruction self-check.

### 34. `appliance.washer.v1` — Washing machine not draining or spinning

| Step | Instruction | Safe self-help? | Escalate / branch |
| --- | --- | --- | --- |
| 1 | Fills/washes normally then fails at drain/spin, or fails earlier in the cycle? | Yes (observation) | Routes likely-parts |
| 2 | Unusual noise (grinding, loud banging) during spin, or no spin at all? | Yes (observation) | Feeds likely-parts |
| 3 | Drain hose kinked, or the accessible drain filter (where the model has one) blocked? | Yes — standard, safe self-help on many models | Often resolves it directly |
| 4 | Load unbalanced or overloaded? | Yes — safe, common, useful check | Often resolves it directly |

**Likely parts:** drain pump (0.3), drain filter/hose blockage (0.2, self-resolvable), door lock mechanism (0.15), motor/belt (0.2), control board (0.15).
**Estimated time:** 45–60 min.
**Danger flags:** none — never instruct opening the electrical housing or accessing the motor directly.
**requiresProfessionalDefault:** true, except the accessible-filter self-check where the model supports it.

### 35. `appliance.stove.v1` — Stove/oven not heating

| Step | Instruction | Safe self-help? | Escalate / branch |
| --- | --- | --- | --- |
| 1 | Stovetop, oven, or both not heating? | Yes (observation) | Routes likely-parts |
| 2 | Electric or gas? | N/A (routing) | Gas → heavier weight toward professional given LPG regulation (v4 §7.9) |
| 3 | Electric — does the element glow at all? Electric oven — any sound (fan, click) when switched on? | Yes (observation) | Feeds likely-parts |
| 4 | Gas — burner clicks/sparks but doesn't ignite, or nothing happens at all? | Yes (observation) | Any gas smell at any point → `emergency.triage` immediately, stop using the appliance |

**Likely parts:** heating element (0.35, electric), thermostat/temperature sensor (0.2), ignition switch/spark module (0.25, gas), gas control valve (0.15, gas), control board/wiring (0.2, electric).
**Estimated time:** 45–60 min.
**Danger flags:** `gas_lpg` on the gas path.
**requiresProfessionalDefault:** true.

---

## Cleaning — 2 (intake, not fault-diagnosis — see Build Blueprint §4.3)

### 36. `clean.residential_intake.v1` — Residential/office cleaning service intake

| Step | Intake question | Notes |
| --- | --- | --- |
| 1 | Property type and approximate size (rooms/bathrooms, or m² for office space)? | Drives the fixed-service quote directly (room count/size × standard time-per-room from the rate card) |
| 2 | Standard clean, or specific focus areas (kitchen deep-clean, bathrooms, windows)? | Scope confirmation |
| 3 | Access considerations (pets, security gate/code, parking, keys held by someone else)? | Passed to the assigned technician |
| 4 | Surfaces/materials needing special care (marble, hardwood, delicate upholstery), or product allergy/chemical-sensitivity requirements? | `chemical_sensitivity` flag passed as a hard constraint, not a preference |
| 5 | Preferred day/time window and recurrence (one-off, weekly, bi-weekly, monthly)? | Booking parameters |

**Danger flags:** `chemical_sensitivity` if flagged in step 4.
**Estimated time:** 1–2 bed ≈ 2–3 hrs; 3+ bed/office ≈ 3–5 hrs (illustrative — ops sets real bands per v4 §3.2's rate-card discipline).
**requiresProfessionalDefault:** n/a — always a booked service.

### 37. `clean.deep_intake.v1` — Post-construction / deep-clean intake

| Step | Intake question | Notes |
| --- | --- | --- |
| 1 | Trigger — post-construction/renovation, post-move, or periodic deep clean of a lived-in property? | Scope driver |
| 2 | Visible construction dust/debris, paint residue, or adhesive residue to remove? | Materially changes time and product needs vs. a standard clean |
| 3 | Any hazardous materials on-site (exposed wiring, unstable flooring, chemical residue, sharp debris)? | Genuine on-site safety question — can force a higher-skill-band technician assignment |
| 4 | Water and electricity active on-site? | Needed for most cleaning equipment |

**Danger flags:** `construction_site_hazards` if step 3 flags anything.
**Estimated time:** 4–8 hrs — never shares a rate-card row with `clean.residential_intake`.
**requiresProfessionalDefault:** n/a — booked service only.

---

## Hairdressing & beauty — 2 (intake, not fault-diagnosis)

### 38. `beauty.hair_intake.v1` — Hair service intake & consultation

| Step | Intake question | Notes |
| --- | --- | --- |
| 1 | Service wanted (cut, colour/treatment, styling, braiding/extensions), reference photos? | Scope |
| 2 | Hair type/condition; any chemical treatment (colour, relaxer, keratin) in the last 4–6 weeks? | Materially affects what can safely be done next (e.g. colour-on-colour timing) |
| 3 | Known allergy to hair/beauty products, or history of a reaction to colour/chemical treatments? | If "yes" or "not sure" → **patch test 24–48 hours before** any chemical service — required, not optional |
| 4 | Salon visit or home-visit? | Affects equipment brought |

**Danger flags:** `chemical_allergy_unconfirmed` — forces the patch-test gate before any chemical service.
**Estimated time:** cut ≈ 30–45 min; colour/treatment ≈ 90–180 min; braiding/extensions ≈ 2–5 hrs.
**requiresProfessionalDefault:** n/a — booked service; the patch-test gate is the one hard "cannot skip" rule.

### 39. `beauty.home_visit_intake.v1` — Home-visit grooming/beauty intake

| Step | Intake question | Notes |
| --- | --- | --- |
| 1 | Service(s) — grooming, waxing, facial, massage — or a package? | Scope |
| 2 | Space and power/water availability at the location? | Some services need a private room, running water, or a power point |
| 3 | Skin condition, medical condition, pregnancy, or medication relevant to the service? | Standard trade contraindication checks (waxing, facials, massage all have these) |
| 4 | Product allergy history? | Same patch-test logic as `beauty.hair_intake` for any new chemical product |

**Danger flags:** `medical_contraindication_unconfirmed` — routes to human review before confirming the relevant service.
**Estimated time:** 30–90 min typical.
**requiresProfessionalDefault:** n/a — booked service; contraindication checks are the hard gate.

---

## Nail technician — 1 (intake, not fault-diagnosis)

### 40. `nail.intake.v1` — Nail service intake & hygiene checklist

| Step | Intake question | Notes |
| --- | --- | --- |
| 1 | Service — manicure/pedicure, gel/acrylic application or removal, nail art? | Scope |
| 2 | Any current nail infection, damage, or open cuticle wound visible? | If yes → defer chemical/cuticle work on the affected nail(s) until healed; flag, don't silently proceed |
| 3 | Known allergy to nail products (acrylic, gel, adhesives)? | Feeds product choice |
| 4 | (System note) Technician confirms sterilised/single-use tools per standard hygiene practice | Ops/compliance item, not customer-facing |

**Danger flags:** `open_wound_or_infection` if step 2 is flagged.
**Estimated time:** manicure/pedicure ≈ 30–45 min; gel/acrylic application ≈ 60–90 min; removal ≈ 20–30 min.
**requiresProfessionalDefault:** n/a — booked service; the hygiene/infection check is the hard gate.

---

## Cross-trade — 2

### 41. `general.triage_router.v1` — "Something's broken, not sure what trade" triage router

| Step | Instruction | Notes |
| --- | --- | --- |
| 1 | What is broken or not working, in the customer's own words (free text)? | Captured as real intake data for the AI-draft pipeline, per v4 §5.16 |
| 2 | Vehicle, something in the home/property, or a service need? | Vehicle → automotive/auto-electrical/HVAC library; home/property → ask water/electricity/appliance to route to plumbing/electrical/appliance; service → cleaning/beauty/nail intake |
| 3 | Any immediate safety concern right now — fire, smoke, gas smell, sparking, flooding, or a vehicle accident? | Takes priority over trade classification at any point → `emergency.triage` |
| 4 | If still unclear after routing questions, offer a general diagnostic call-out | Rather than forcing a guess into the wrong trade checklist |

**Danger flags:** none directly — this checklist's only job is safe, fast, correct routing, with an escape hatch to emergency triage at any point.
**Estimated time:** n/a — a routing step, not a billable diagnostic itself.
**requiresProfessionalDefault:** n/a — routes to the correct trade-specific checklist, which then carries its own default.

### 42. `emergency.triage.v1` — Emergency triage (fire/gas/electrical/flood/accident)

| Step | Instruction | Notes |
| --- | --- | --- |
| 1 | Active fire, smoke, or a strong gas smell right now? | Advise evacuating immediately; dispatch is deterministic and immediate per v4 §3.1 — never AI-gated, never waiting on a checklist to "finish" |
| 2 | Active flooding, electrical sparking, or a vehicle accident/roadside hazard? | Same rule — immediate deterministic dispatch |
| 3 | Location and a callback number, captured fast; photo only from a safe distance | Speed matters more than completeness here |
| 4 | This checklist never produces a quote, a `requiresProfessional: false` outcome, or a self-help branch, under any circumstance | Only outputs: "dispatch now" and "safety instruction while waiting" |

**Danger flags:** this checklist is itself a danger-flag container — `fire_risk`, `gas_lpg`, `active_flooding`, `electrics_under_load`, `roadside_unsafe_location`, `vehicle_accident` — any one of these present in any other checklist routes here, and this checklist always wins routing priority.
**Estimated time:** n/a — dispatch-time governed by v4's emergency SLA, not this document.
**requiresProfessionalDefault:** true, unconditionally, always.
