from flask import Flask, request, jsonify, render_template
import tensorflow as tf
import json
import os
import numpy as np
from PIL import Image


# ==========================================================
# FLASK APPLICATION
# ==========================================================

app = Flask(__name__)


# ==========================================================
# MODEL CONFIGURATION
# ==========================================================

MODEL_PATH = os.path.join(
    "model",
    "best_model.keras"
)

CLASS_NAMES_PATH = os.path.join(
    "model",
    "class_names.json"
)

IMAGE_SIZE = (224, 224)


# ==========================================================
# LOAD MODEL
# ==========================================================

print("=" * 60)
print("LOADING MODEL")
print("=" * 60)

model = tf.keras.models.load_model(
    MODEL_PATH
)

print("Model berhasil dimuat.")


# ==========================================================
# LOAD CLASS NAMES
# ==========================================================

with open(
    CLASS_NAMES_PATH,
    "r"
) as f:

    CLASS_NAMES = json.load(f)


print("Class Names :", CLASS_NAMES)

print("=" * 60)


# ==========================================================
# HOME ROUTE
# ==========================================================

@app.route("/")
def home():

    return render_template("index.html")


# ==========================================================
# PREDICTION API
# ==========================================================

@app.route(
    "/predict",
    methods=["POST"]
)
def predict():

    # ------------------------------------------------------
    # CHECK FILE
    # ------------------------------------------------------

    if "image" not in request.files:

        return jsonify({
            "error": "Tidak ada file gambar yang dikirim."
        }), 400


    file = request.files["image"]


    if file.filename == "":

        return jsonify({
            "error": "Nama file gambar kosong."
        }), 400


    try:

        # --------------------------------------------------
        # LOAD IMAGE
        # --------------------------------------------------

        img = Image.open(
            file.stream
        ).convert("RGB")


        # --------------------------------------------------
        # RESIZE IMAGE
        # --------------------------------------------------

        img = img.resize(
            IMAGE_SIZE
        )


        # --------------------------------------------------
        # CONVERT TO ARRAY
        # --------------------------------------------------

        img_array = np.array(
            img,
            dtype=np.float32
        )


        # --------------------------------------------------
        # ADD BATCH DIMENSION
        # --------------------------------------------------

        img_array = np.expand_dims(
            img_array,
            axis=0
        )


        # --------------------------------------------------
        # MODEL PREDICTION
        # --------------------------------------------------

        prediction = model.predict(
            img_array,
            verbose=0
        )[0]


        # --------------------------------------------------
        # GET PREDICTED CLASS
        # --------------------------------------------------

        predicted_index = int(
            np.argmax(prediction)
        )

        predicted_class = CLASS_NAMES[
            predicted_index
        ]


        # --------------------------------------------------
        # GET CONFIDENCE
        # --------------------------------------------------

        confidence = float(
            prediction[predicted_index] * 100
        )


        # --------------------------------------------------
        # GET ALL PROBABILITIES
        # --------------------------------------------------

        probabilities = {

            CLASS_NAMES[i]:
            round(
                float(prediction[i] * 100),
                2
            )

            for i in range(
                len(CLASS_NAMES)
            )

        }


        # --------------------------------------------------
        # RETURN RESULT
        # --------------------------------------------------

        return jsonify({

            "prediction": predicted_class,

            "confidence": round(
                confidence,
                2
            ),

            "probabilities": probabilities

        })


    except Exception as e:

        return jsonify({

            "error": str(e)

        }), 500


# ==========================================================
# RUN FLASK
# ==========================================================

if __name__ == "__main__":

    app.run(
        debug=True
    )