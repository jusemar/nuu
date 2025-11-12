export const cloudinaryService = {
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'product_images'); // ← Valor fixo

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/dl3nuks1d/image/upload`, // ← Valor fixo
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) throw new Error('Upload failed');
    
    return response.json();
  },
  // ...
};