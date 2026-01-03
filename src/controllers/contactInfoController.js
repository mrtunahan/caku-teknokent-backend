const ContactInfo = require('../models/ContactInfo');

exports.getContactInfo = async (req, res) => {
  try {
    let contactInfo = await ContactInfo.findOne();
    
    if (!contactInfo) {
      // İlk kez çağrılıyorsa boş bilgiler oluştur
      contactInfo = await ContactInfo.create({
        phone_1: '',
        phone_1_label: '',
        phone_2: '',
        phone_2_label: '',
        phone_3: '',
        phone_3_label: '',
        email: '',
        address: '',
        map_lat: null,
        map_lng: null,
        map_embed: ''
      });
    }

    res.json({ success: true, data: contactInfo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'İletişim bilgileri alınamadı' });
  }
};

exports.updateContactInfo = async (req, res) => {
  try {
    const { phone_1, phone_1_label, phone_2, phone_2_label, phone_3, phone_3_label, email, address, map_lat, map_lng, map_embed } = req.body;

    let contactInfo = await ContactInfo.findOne();

    if (!contactInfo) {
      contactInfo = await ContactInfo.create({
        phone_1: phone_1 || '',
        phone_1_label: phone_1_label || '',
        phone_2: phone_2 || '',
        phone_2_label: phone_2_label || '',
        phone_3: phone_3 || '',
        phone_3_label: phone_3_label || '',
        email: email || '',
        address: address || '',
        map_lat: map_lat || null,
        map_lng: map_lng || null,
        map_embed: map_embed || ''
      });
    } else {
      await contactInfo.update({
        phone_1: phone_1 || '',
        phone_1_label: phone_1_label || '',
        phone_2: phone_2 || '',
        phone_2_label: phone_2_label || '',
        phone_3: phone_3 || '',
        phone_3_label: phone_3_label || '',
        email: email || '',
        address: address || '',
        map_lat: map_lat || null,
        map_lng: map_lng || null,
        map_embed: map_embed || ''
      });
    }

    res.json({ success: true, message: 'İletişim bilgileri güncellendi', data: contactInfo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'İletişim bilgileri güncellenemedi' });
  }
};