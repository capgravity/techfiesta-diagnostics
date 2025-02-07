from flask import Flask, request, jsonify
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
from PIL import Image
import numpy as np
import os
import tensorflow as tf
import matplotlib.pyplot as plt
from tensorflow.keras.applications.vgg19 import VGG19, preprocess_input
import uuid
import base64
from openai import OpenAI
from dotenv import load_dotenv
import requests
from io import BytesIO


load_dotenv()

app = Flask(__name__)

# Initialize the OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Load the pre-trained models
mri_model = load_model("mri_classifier_mobilenetv2.h5")
alzheimer_model = load_model('alzheimer_model.h5')

# Image sizes expected by the models
mri_img_size = (224, 224)
alzheimer_img_size = (128, 128)

# Grad-CAM++ Functions
def grad_cam_plus_plus(model, img_array, layer_name="block5_conv3"):
    """
    Generate Grad-CAM++ heatmap for a given image and model.
    """
    grad_model = tf.keras.models.Model(
        inputs=model.input,
        outputs=[model.get_layer(layer_name).output, model.output],
    )

    with tf.GradientTape() as tape:
        conv_output, predictions = grad_model(img_array)
        class_index = tf.argmax(predictions[0])
        loss = predictions[:, class_index]

    grads = tape.gradient(loss, conv_output)
    first_derivative = grads
    second_derivative = grads * grads
    third_derivative = grads * grads * grads

    global_sum = tf.reduce_sum(conv_output, axis=(0, 1, 2))
    alpha_num = second_derivative
    alpha_denom = second_derivative * 2.0 + third_derivative * global_sum
    alpha_denom = tf.where(alpha_denom != 0.0, alpha_denom, tf.ones_like(alpha_denom))
    alphas = alpha_num / alpha_denom
    alphas_normalized = alphas / tf.reduce_sum(alphas, axis=(0, 1))

    weights = tf.reduce_sum(first_derivative * alphas_normalized, axis=(0, 1))
    heatmap = tf.reduce_sum(weights * conv_output[0], axis=-1)
    heatmap = tf.maximum(heatmap, 0)
    heatmap /= tf.reduce_max(heatmap) + 1e-10

    return heatmap.numpy()

def show_grad_cam_plus_plus(img_path, output_path, alpha=0.5):
    """
    Overlay Grad-CAM++ heatmap on the original image.
    """
    img = image.load_img(img_path, target_size=(224, 224))
    img_array = image.img_to_array(img)
    img_array_preprocessed = preprocess_input(np.expand_dims(img_array, axis=0))

    model = VGG19(weights="imagenet")

    heatmap = grad_cam_plus_plus(model, img_array_preprocessed)

    heatmap = tf.image.resize(heatmap[..., tf.newaxis], (224, 224)).numpy().squeeze()

    # Visualize
    plt.figure(figsize=(10, 5))
    plt.subplot(1, 1, 1)
    plt.imshow(img)
    plt.imshow(heatmap, cmap="jet", alpha=alpha)
    plt.axis("off")
    plt.savefig(output_path, bbox_inches="tight", pad_inches=0, dpi=300)

def predict_mri(img_path):
    """Predict whether the image is MRI or Non-MRI."""
    img = image.load_img(img_path, target_size=mri_img_size)
    img_array = image.img_to_array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    prediction = mri_model.predict(img_array)
    return "MRI" if prediction[0][0] < 0.5 else "Non-MRI"

def preprocess_image(image_path, target_size=alzheimer_img_size):
    """Preprocess the image for the Alzheimer's model."""
    image = Image.open(image_path).convert('RGB')
    image = image.resize(target_size)
    image = np.array(image) / 255.0  # Normalize to [0, 1]
    image = np.expand_dims(image, axis=0)  # Add batch dimension
    return image

# Endpoint for Grad-CAM++
@app.route('/process', methods=['POST'])
def process_image():
    data = request.json
    image_url = data.get('imageUrl')

    if not image_url:
        return jsonify({"error": "No image URL provided"}), 400

    # Download the image
    img_path = os.path.join(os.getcwd(), f"temp_{uuid.uuid4()}.jpg")
    os.system(f"curl -o {img_path} {image_url}")

    # Generate the output path
    output_path = os.path.join(os.getcwd(), f"gradcam_output_{uuid.uuid4()}.png")

    # Process the image
    show_grad_cam_plus_plus(img_path, output_path, alpha=0.5)
    print("Heatmap saved at:", output_path)

    # Clean up the temporary image
    os.remove(img_path)

    return jsonify({"heatmapPath": output_path})

# Endpoint for OpenAI GPT-4 Turbo with Vision
@app.route('/analyze', methods=['POST'])
def analyze_image():
    # Get the text prompt and image URL from the request
    data = request.json
    if not data or 'prompt' not in data or 'image_url' not in data:
        return jsonify({"error": "Please provide both 'prompt' and 'image_url' in the JSON payload"}), 400

    user_prompt = data['prompt']
    image_url = data['image_url']

    # Define the text prompt and include the image URL
    prompt = [
        {
            "type": "text",
            "text": user_prompt
        },
        {
            "type": "image_url",
            "image_url": {
                "url": image_url
            }
        }
    ]

    # Call OpenAI's GPT-4 Turbo with Vision model
    response = client.chat.completions.create(
        model="gpt-4-turbo",
        messages=[
            {"role": "system", "content": "You are a helpful medical assistant."},
            {"role": "user", "content": prompt}
        ]
    )

    # Return the response
    return jsonify({"response": response.choices[0].message.content})


# Endpoint for MRI and Alzheimer's prediction
@app.route('/predict', methods=['POST'])
def predict():
    """Endpoint to handle image URL and prediction."""
    data = request.json
    if not data or 'imageUrl' not in data:
        return jsonify({"error": "No image URL provided"}), 400

    image_url = data['imageUrl']

    try:
        # Download the image from the URL
        response = requests.get(image_url)
        if response.status_code != 200:
            return jsonify({"error": "Failed to download the image"}), 400

        # Load the image from the response content
        img = Image.open(BytesIO(response.content))

        # Save the image temporarily (optional, for debugging)
        temp_path = "temp_image.jpg"
        img.save(temp_path)

        # First, check if the image is an MRI
        mri_result = predict_mri(temp_path)
        if mri_result == "Non-MRI":
            return jsonify({"message": "The uploaded image is not an MRI."})

        # If it is an MRI, predict Alzheimer's
        img_array = preprocess_image(temp_path)
        prediction = alzheimer_model.predict(img_array)
        probability = float(prediction[0][0]) * 100

        return jsonify({
            "prediction": "MRI",
            "alzheimer_probability": probability
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        # Clean up: Delete the temporary file
        if os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)