'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // News tablosundaki image_url'leri düzelt (parametreli sorgu)
    await queryInterface.sequelize.query(`
      UPDATE News 
      SET image_url = CONCAT(?, image_url) 
      WHERE image_url IS NOT NULL 
        AND image_url NOT LIKE ?
        AND image_url NOT LIKE ?
        AND image_url NOT LIKE ?
    `, {
      replacements: ['uploads/images/', 'uploads/%', '/%', 'http%']
    });

    // BoardMember tablosundaki image_url'leri düzelt
    await queryInterface.sequelize.query(`
      UPDATE BoardMembers 
      SET image_url = CONCAT(?, image_url) 
      WHERE image_url IS NOT NULL 
        AND image_url NOT LIKE ?
        AND image_url NOT LIKE ?
        AND image_url NOT LIKE ?
        AND image_url NOT LIKE ?
    `, {
      replacements: ['uploads/images/yon_kurulu/', 'uploads/%', '/%', 'http%', 'yon_kurulu/%']
    });

    // Company tablosundaki logo_url'leri düzelt
    await queryInterface.sequelize.query(`
      UPDATE Companies 
      SET logo_url = CONCAT(?, logo_url) 
      WHERE logo_url IS NOT NULL 
        AND logo_url NOT LIKE ?
        AND logo_url NOT LIKE ?
        AND logo_url NOT LIKE ?
        AND logo_url NOT LIKE ?
    `, {
      replacements: ['uploads/images/logos/', 'uploads/%', '/%', 'http%', 'logos/%']
    });

    // Stakeholder tablosundaki logo_url'leri düzelt
    await queryInterface.sequelize.query(`
      UPDATE Stakeholders 
      SET logo_url = CONCAT(?, logo_url) 
      WHERE logo_url IS NOT NULL 
        AND logo_url NOT LIKE ?
        AND logo_url NOT LIKE ?
        AND logo_url NOT LIKE ?
        AND logo_url NOT LIKE ?
    `, {
      replacements: ['uploads/images/paydas/', 'uploads/%', '/%', 'http%', 'paydas/%']
    });

    // CompanyNews tablosundaki image'yi düzelt
    await queryInterface.sequelize.query(`
      UPDATE CompanyNews 
      SET image = CONCAT(?, image) 
      WHERE image IS NOT NULL 
        AND image NOT LIKE ?
        AND image NOT LIKE ?
        AND image NOT LIKE ?
    `, {
      replacements: ['uploads/images/', 'uploads/%', '/%', 'http%']
    });

    console.log('✅ Resim yolları düzeltildi');
  },

  down: async (queryInterface, Sequelize) => {
    // Rollback (geri al) işlemi
    console.log('⚠️ Migration rollback işlemi (geri alma) önerilmez!');
    // Gerçek rollback yapmak karmaşık olacağı için boş bırakıyoruz
  }
};
