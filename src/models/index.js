// Models Index - Tüm modelleri buradan export etmeliyiz

// Database
const sequelize = require('../config/database');

// Modeller
const User = require('./User');
const Room = require('./Room');
const TeamMember = require('./TeamMember');
const BoardMember = require('./BoardMember');
const Company = require('./Company');
const News = require('./News');
const CompanyNews = require('./CompanyNews');
const Contact = require('./Contact');
const ProjectApplication = require('./ProjectApplication');
const JobApplication = require('./JobApplication');
const InternshipAd = require('./InternshipAd');
const PageContent = require('./PageContent');
const Stakeholder = require('./Stakeholder');
const Booking = require('./Booking');
const Support = require('./Support');
const Legislation = require('./Legislation');
const Identity = require('./Identity');
const Legal = require('./Legal');
const TtoService = require('./TtoService');
const ChatbotKnowledge = require('./ChatbotKnowledge');
const OfficeConfig = require('./OfficeConfig');
const Stat = require('./Stat');
const ContactInfo = require('./ContactInfo');

module.exports = {
  sequelize,
  User,
  Room,
  TeamMember,
  BoardMember,
  Company,
  News,
  CompanyNews,
  Contact,
  ProjectApplication,
  JobApplication,
  InternshipAd,
  PageContent,
  Stakeholder,
  Booking,
  Support,
  Legislation,
  Identity,
  Legal,
  TtoService,
  ChatbotKnowledge,
  OfficeConfig,
  Stat,
  ContactInfo
};