import tensorflow as tf
import numpy as np
import matplotlib.pyplot as plt
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications.vgg19 import VGG19, preprocess_input


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


def show_grad_cam_plus_plus(img_path, alpha=0.5):
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

output_path = "output_HEATMAP_pictures/gradcam_output2.png"  # Path where the Grad-CAM output image will be saved
img_path = "input_MRI_pictures/images.jpg"  # Path to your input MRI image

# output_path = "Replace with mri scan path e.g C:/Users/vedan/OneDrive/Documents/beginners/dementia/alzheimer.jpg"
# img_path = "Replace with path where gradcam png is to be saved e.g C:/Users/vedan/OneDrive/Documents/beginners/dementia/gradcam_output.png"
show_grad_cam_plus_plus(img_path, alpha=0.5)