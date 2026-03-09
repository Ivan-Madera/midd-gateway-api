'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      event_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      client_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'clients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      external_client_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      details: {
        type: Sequelize.JSON,
        allowNull: true
      },
      ip_address: {
        type: Sequelize.STRING,
        allowNull: true
      },
      user_agent: {
        type: Sequelize.STRING,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
        allowNull: false
      }
    })
  },

  down: (queryInterface) => {
    return queryInterface.dropTable('audit_logs')
  }
}
