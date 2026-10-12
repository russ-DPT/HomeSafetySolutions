# I've fallen and I can't get up

*By Russ L'HommeDieu, DPT, ATP | Home Safety Solutions*

"I've fallen and I can't get up."

For most of us, that line brings back a late-night TV commercial and maybe a chuckle. For me, after 35 years as a physical therapist, it brings back faces. I have met too many people who lived that sentence for real, alone on a kitchen floor or wedged between the toilet and the tub, waiting for someone to notice they were missing.

The joke stuck because the fear is universal. The punchline is that, decades later, we are still mostly relying on the same solution from that commercial. That is finally starting to change.

## Falls are common, costly, and getting deadlier

Falls are the leading cause of injury for adults 65 and older, and the numbers are not small (CDC):

- More than 14 million older adults, about 1 in 4, report a fall every year. Fewer than half tell their doctor.
- About 4.5 million emergency department visits each year are due to older adult falls, leading to roughly 1.4 million hospitalizations.
- Nearly 319,000 older adults are hospitalized for hip fractures each year, and falls cause the vast majority of them.
- Falls are the most common cause of traumatic brain injury in older adults.
- The fall death rate rose 21% between 2018 and 2024, from 64.7 to 78.4 deaths per 100,000 older adults.
- Falling once doubles your chance of falling again.

Then there is the injury nobody codes for: fear. Many people who fall, even without injury, start doing less. Less activity means less strength, and less strength means more falls ([CDC Facts About Older Adult Falls](https://www.cdc.gov/falls/data-research/facts-stats/index.html)).

## The fall is bad. The wait can be worse.

Clinicians call it the "long lie": being stuck on the floor for an hour or more after a fall. It is where a survivable event turns into a hospitalization, a nursing home admission, or worse.

The clearest data comes from a 2008 BMJ study by Fleming and Brayne that followed people over 90 for a year:

- 82% of falls happened when the person was alone.
- 80% of those who fell could not get up on their own after at least one fall.
- 30% lay on the floor for an hour or more.
- A long lie was strongly linked to serious injury, hospital admission, and moving into long-term care.

The longer someone lies there, the more the problems stack up: dehydration, pressure injuries, hypothermia, pneumonia, and rhabdomyolysis, a breakdown of muscle that can damage the kidneys. And the fear that follows a long lie is often worse than the fear after a quick recovery. The fall starts the clock. How fast help arrives decides how the story ends.

## Why I got frustrated issuing PERS buttons

For years, a big part of my job was issuing Personal Emergency Response Systems (PERS): the pendant or wristband with a button you press to call for help. On paper, it solves the long lie. In real homes, it fails at four separate points, and every one of them has to go right for the system to work.

1. **Accepting the device.** Many people simply do not want it. A pendant announces "I am old and frail" to every visitor. Plenty of veterans I worked with told me, politely or not, that they did not need one.
2. **Charging the device.** Newer wearables need regular charging. That is one more task for someone who may already be juggling medications, appointments, and memory changes. A dead battery turns the device into jewelry.
3. **Wearing the device.** It comes off for showers, for sleep, because it itches, or because it gets left on the nightstand. Yet the bathroom and the middle-of-the-night trip to the toilet are exactly where many falls happen.
4. **Pushing the button.** Even when the first three go right, the person has to be conscious, oriented, and willing to call. Many are not. Some are confused or hurt. Others are embarrassed, believe they can get up on their own, or do not want to "bother" anyone.

That last point is not just my experience. In the Fleming and Brayne study, call alarms were widely available but went unused in most of the falls that led to a long lie. The device was in the home. It just never got pressed.

If a safety system depends on four behaviors in a row from the person at highest risk, it is not really a safety system. It is a hope.

## The search for help that does not need a button

About ten years ago, while I was serving as a Home Safety Coordinator at the VA, I started asking a different question. What if the home itself could notice a fall? No pendant, no charging, no button, and no decision required from someone who is hurt or confused. That is passive fall detection.

Cameras were an obvious option and an obvious non-starter. Nobody wants a lens in the bathroom. So I kept digging, and I stumbled onto micro-Doppler radar.

Radar sends out low-power radio waves and listens for the echo. When a person moves, the echo shifts slightly in frequency. Arms, legs, and torso each create their own small shifts, called micro-Doppler signatures. A sudden drop to the floor followed by stillness looks very different from someone sitting down in a chair. The best part: radar sees motion, not faces. It works in the dark, through steam, and without capturing an image.

Back then, the technology was not ready. False alarms were common, setups were finicky, and costs were high. But the idea was right, and the gap has been closing fast. Today's radar sensors pair with on-device AI that can tell a fall from a nap far more reliably than anything I tested a decade ago.

## Now your Wi-Fi can do it too

Radar is no longer the only option. Researchers and hobbyists are showing that ordinary Wi-Fi signals can sense movement well enough to tell whether someone is in a room and what their body is doing.

The principle is similar. Wi-Fi signals bounce off walls, furniture, and people on their way between devices. When a person moves, those reflections change in measurable ways, captured in what engineers call Channel State Information (CSI). Software, and increasingly AI, reads those changes to infer standing, sitting, walking, or lying still. No camera, no wearable.

### You can even build your own

Geeky Gadgets just published a walkthrough, *Replacing Security Cameras with Three $10 ESP32S3 Wi-Fi Boards* (Julian Horsey, October 12, 2026), based on a video from Better Stack. The setup is surprisingly simple:

- **Hardware:** three ESP32-S3 microcontroller boards, about $10 each, placed around a room to send and receive Wi-Fi signals.
- **Software:** RuView, an open-source project that combines Wi-Fi CSI data with AI for motion and pose detection.
- **Training:** a webcam is used temporarily to label poses so the AI learns what sitting, standing, and squatting "look like" in Wi-Fi.

The results are promising and honest about limits. In their testing, the system detected room occupancy with 96% accuracy and basic movements like sitting, standing, and squatting at 79.5%, but it struggled with small, fast motions like waving, at 13%. It also needed retraining when moved to a new room or used with a different person.

Watch the demo here:

{{youtube:9Tihk9_jUyo|Better Stack: Wi-Fi sensing demo}}

The article also raises a fair warning. Because Wi-Fi passes through walls, the same technology could be misused to watch people without consent, and the upcoming 802.11bf Wi-Fi standard is expected to build sensing into everyday routers. For fall detection, that means consent, encryption, and clear rules matter as much as accuracy.

## LiDAR: another contender

There is a third technology worth watching: LiDAR (light detection and ranging). It is the same sensing that helps self-driving cars and robot vacuums map the world, and the parts have become small and cheap as a result.

LiDAR sends out pulses of invisible laser light and times how long each one takes to bounce back. The result is a 3D "point cloud": a cloud of dots shaped like the room and the people in it. The sensor sees body shape and position, not faces, skin, or what is on the TV. It also works the same in the dark as in daylight.

The research is encouraging. A 2026 study in the *IEEE Sensors Journal* used a single LiDAR sensor to track a person and flag falls, reaching 89.2% accuracy and 98.3% sensitivity across fall and non-fall scenarios. In plain terms, it caught nearly every real fall, at the cost of some false alarms. It also ran on very little computing power, which matters for an always-on device in a home.

LiDAR has trade-offs. Light does not pass through walls the way radio waves do, so a home may need a sensor in each room that matters most, especially the bathroom and bedroom. A sensor also needs a clear line of sight, so furniture can create blind spots. On the other hand, that same limitation is a privacy plus: a LiDAR sensor cannot see into the neighbor's apartment.

Radar, Wi-Fi, and LiDAR are not really rivals so much as tools. The best systems of the next few years may well combine them, letting each cover the others' blind spots.

## Peace of mind for the rest of us

Most people are not going to solder microcontrollers and train an AI model in their parent's living room. Nor should they have to. That is where commercial companies come in, and [Cherish Health](https://www.cherishhealth.com) is one blazing the trail.

Cherish builds radar-based sensors with on-device AI that monitor a home ambiently, through the air, without cameras and without asking the person to wear, charge, or press anything. Its system works across multiple rooms and multiple people, detects emergencies such as falls, and brings help. Through a partnership with Alarm.com, alerts can reach a family care circle or professional monitoring.

Look back at those four PERS friction points. Passive sensing removes all four. There is nothing to accept on your body, nothing to charge, nothing to remember to wear, and no button to push. The help comes because the home noticed, not because a frightened, injured person made the right decision on the floor.

This matters most for remote caregivers. If you are caring for a mom, dad, or spouse from another city or another state, you know the feeling of an unanswered phone call. Passive detection does not replace visits, good balance training, or a safe home. What it offers is a quieter kind of reassurance: if something happens, somebody will know, and somebody will come.

## From punchline to peace of mind

"I've fallen and I can't get up" was never really funny. It described a real gap in care: the minutes and hours between a fall and help arriving. For decades we asked the person on the floor to close that gap themselves. Micro-Doppler radar, Wi-Fi sensing, LiDAR, and companies like Cherish are finally letting the home close it instead.

If you are a clinician, a caregiver, or an adult child worrying from a distance, this is the moment to start paying attention.

## Sources

- CDC. [Older Adult Falls Data](https://www.cdc.gov/falls/data-research/index.html). Updated September 4, 2026.
- CDC. [Facts About Older Adult Falls](https://www.cdc.gov/falls/data-research/facts-stats/index.html). Updated September 4, 2026.
- Fleming J, Brayne C. [Inability to get up after falling, subsequent time on floor, and summoning help: prospective cohort study in people over 90](https://www.bmj.com/content/337/bmj.a2227). *BMJ*. 2008;337:a2227.
- Horsey J. *Replacing Security Cameras with Three $10 ESP32S3 Wi-Fi Boards*. Geeky Gadgets. October 12, 2026.
- Better Stack. [Wi-Fi sensing demo video](https://www.youtube.com/watch?v=9Tihk9_jUyo). YouTube.
- Kim GY, Park S, Lee S, Seo B, Choi SH, Park SM. Lightweight Cluster Matching-Based Tracking Method for Fall Detection Using a Single-LiDAR. *IEEE Sensors Journal*. 2026;26(9):13751-13763.
- [Cherish Health](https://www.cherishhealth.com).
