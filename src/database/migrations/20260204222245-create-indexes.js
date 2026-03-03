'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, _Sequelize) {
    await Promise.all([
      queryInterface.addIndex('sessions', ['client_id'], {
        name: 'idx_client_id'
      }),
      queryInterface.addIndex('sessions', ['expires_at'], {
        name: 'idx_expires_at'
      }),
      queryInterface.addIndex('sessions', ['revoked_at'], {
        name: 'idx_revoked_at'
      })
    ])
  },

  async down(queryInterface, _Sequelize) {
    await Promise.all([
      queryInterface.removeIndex('sessions', 'idx_client_id'),
      queryInterface.removeIndex('sessions', 'idx_expires_at'),
      queryInterface.removeIndex('sessions', 'idx_revoked_at')
    ])
  }
}
