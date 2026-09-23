"""Capture timed frames from a disposable copy of the v1.7 TouchDesigner project.

The disposable copy's enabled Execute DAT loads this file from ``onStart``.
The source .toe is never opened by this script. Required environment variables:

``TD_REFERENCE_OUTPUT``
    Directory that receives PNG frames, ``channels.csv``, and ``manifest.json``.
``TD_REFERENCE_SOURCE``
    Path to the untouched authoritative .toe, used only for hashing.

``TD_REFERENCE_AUDIO`` and ``TD_REFERENCE_FRAMES`` are optional. Frame delays
default to 60, 180, 300, and 420 (one, three, five, and seven seconds at 60 fps).
"""

import csv
import hashlib
import json
import os
from pathlib import Path


OUTPUT_DIRECTORY = Path(os.environ["TD_REFERENCE_OUTPUT"])
SOURCE_TOE = Path(os.environ["TD_REFERENCE_SOURCE"])
AUDIO_PATH = Path(os.environ.get("TD_REFERENCE_AUDIO", ""))
CAPTURE_FRAMES = tuple(
	int(value.strip())
	for value in os.environ.get("TD_REFERENCE_FRAMES", "60,180,300,420").split(",")
	if value.strip()
)
TRACE_PATH = OUTPUT_DIRECTORY / "channels.csv"
MANIFEST_PATH = OUTPUT_DIRECTORY / "manifest.json"
captures = []


def sha256(path):
	digest = hashlib.sha256()
	with open(path, "rb") as source:
		for chunk in iter(lambda: source.read(1024 * 1024), b""):
			digest.update(chunk)
	return digest.hexdigest()


def channel_value(path, channel="chan1"):
	operator = op(path)
	if operator is None or operator.numChans == 0:
		return None
	selected = operator[channel] if channel in operator.chans() else operator[0]
	return float(selected.eval())


def write_manifest(final_top):
	manifest = {
		"touchdesigner_build": app.build,
		"source_toe": SOURCE_TOE.as_posix(),
		"source_toe_sha256": sha256(SOURCE_TOE),
		"audio_path": AUDIO_PATH.as_posix() if AUDIO_PATH else None,
		"audio_sha256": sha256(AUDIO_PATH) if AUDIO_PATH and AUDIO_PATH.exists() else None,
		"capture_resolution": [int(final_top.width), int(final_top.height)],
		"warmup_frames": list(CAPTURE_FRAMES),
		"captures": captures,
		"evaluated_parameters": {
			"camera_rotation_degrees_per_second": 3.0,
			"feedback_blur_pixels": 13,
			"luma_blur_black_width": 54,
			"glow_blend": 0.406015,
			"optical_flow_scale": 10.0,
			"scanline_period": 0.003,
			"scanline_threshold": 0.5465995,
		},
	}
	MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def capture_reference(index, requested_frame):
	final_top = op("/project1/null1")
	if final_top is None:
		raise RuntimeError("missing authoritative output /project1/null1")

	final_top.cook(force=True)
	filename = "touchdesigner-{0:05d}.png".format(requested_frame)
	final_top.save((OUTPUT_DIRECTORY / filename).as_posix())
	row = {
		"requested_frame": int(requested_frame),
		"capture_frame": int(absTime.frame),
		"capture_seconds": float(absTime.seconds),
		"low_envelope": channel_value("/project1/null2"),
		"high_envelope": channel_value("/project1/null3"),
		"feedback_drive": channel_value("/project1/math3"),
		"filename": filename,
	}
	captures.append(row)
	with TRACE_PATH.open("a", newline="", encoding="utf-8") as stream:
		writer = csv.DictWriter(stream, fieldnames=row.keys())
		if stream.tell() == 0:
			writer.writeheader()
		writer.writerow(row)
	write_manifest(final_top)


OUTPUT_DIRECTORY.mkdir(parents=True, exist_ok=True)
if TRACE_PATH.exists():
	TRACE_PATH.unlink()
reset_script = op("/project1/OpticalFlow/reset_script")
if reset_script is not None:
	reset_script.run()
for capture_index, frame_delay in enumerate(CAPTURE_FRAMES):
	run(
		capture_reference,
		capture_index,
		frame_delay,
		delayFrames=frame_delay,
		wallTime=True,
		delayRef=op.TDResources,
	)
