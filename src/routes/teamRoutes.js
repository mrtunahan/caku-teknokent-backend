const express = require("express");
const router = express.Router();
const TeamMember = require("../models/TeamMember");
const { handleError } = require("../utils/errorHandler");

// DÜZELTME 1: Var olan imageUpload.js dosyanı buraya çağırdık
const upload = require("../middleware/imageUpload"); 

// Tüm ekibi getir
router.get("/", async (req, res) => {
  try {
    const members = await TeamMember.findAll({ order: [['createdAt', 'ASC']] });
    res.json({ success: true, data: members });
  } catch (error) {
    return handleError(error, res, 500);
  }
});

// Yeni üye ekle
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, title, email, extension, linkedin } = req.body;
    
    // DÜZELTME 2: imageUpload.js resimleri 'images' klasörüne attığı için yolu güncelledik
    const image = req.file ? `/uploads/images/${req.file.filename}` : null;

    const newMember = await TeamMember.create({
      name,
      title,
      email,
      extension,
      linkedin,
      image,
    });

    res.json({ success: true, message: "Ekip üyesi eklendi.", data: newMember });
  } catch (error) {
    return handleError(error, res, 500);
  }
});

// Üye sil
router.delete("/:id", async (req, res) => {
  try {
    const member = await TeamMember.findByPk(req.params.id);
    if (!member) return res.status(404).json({ message: "Bulunamadı" });

    await member.destroy();
    res.json({ success: true, message: "Silindi." });
  } catch (error) {
    return handleError(error, res, 500);
  }
});

// Üye güncelle
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const member = await TeamMember.findByPk(req.params.id);
    if (!member) return res.status(404).json({ message: "Bulunamadı" });

    const { name, title, email, extension, linkedin } = req.body;
    
    // Eğer yeni resim varsa güncelle, yoksa eskisini koru
    const image = req.file ? `/uploads/images/${req.file.filename}` : member.image;

    await member.update({ name, title, email, extension, linkedin, image });

    res.json({ success: true, message: "Güncellendi.", data: member });
  } catch (error) {
    return handleError(error, res, 500);
  }
});

module.exports = router;