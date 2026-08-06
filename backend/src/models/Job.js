// src/models/Job.js
const { getDocumentById, updateDocument, deleteDocument, queryDocuments, createDocument, COLLECTIONS } = require('../config/database');

class Job {
  constructor(data) {
    this.id = data.id;
    this.customerId = data.customerId;
    this.professionalId = data.professionalId;
    this.category = data.category;
    this.serviceType = data.serviceType;
    this.description = data.description;
    this.photos = data.photos || [];
    this.voiceNote = data.voiceNote;
    this.budget = data.budget;
    this.urgency = data.urgency || 'flexible';
    this.status = data.status || 'posted';
    this.address = data.address;
    this.latitude = data.latitude;
    this.longitude = data.longitude;
    this.createdAt = data.createdAt || new Date();
    this.scheduledDate = data.scheduledDate;
    this.completedDate = data.completedDate;
    this.quotes = data.quotes || [];
    this.expiresAt = data.expiresAt;
    this.acceptedQuoteId = data.acceptedQuoteId;
    this.paymentMethod = data.paymentMethod;
    this.isPaid = data.isPaid || false;
    this.finalPrice = data.finalPrice;
    this.review = data.review;
    this.isEmergency = data.isEmergency || false;
    this.isRecurring = data.isRecurring || false;
    this.recurringFrequency = data.recurringFrequency;
    this.businessId = data.businessId;
    this.professionalName = data.professionalName;
  }

  toJSON() {
    return {
      id: this.id,
      customerId: this.customerId,
      professionalId: this.professionalId,
      category: this.category,
      serviceType: this.serviceType,
      description: this.description,
      photos: this.photos,
      voiceNote: this.voiceNote,
      budget: this.budget,
      urgency: this.urgency,
      status: this.status,
      address: this.address,
      latitude: this.latitude,
      longitude: this.longitude,
      createdAt: this.createdAt,
      scheduledDate: this.scheduledDate,
      completedDate: this.completedDate,
      quotes: this.quotes,
      acceptedQuoteId: this.acceptedQuoteId,
      paymentMethod: this.paymentMethod,
      isPaid: this.isPaid,
      finalPrice: this.finalPrice,
      review: this.review,
      isEmergency: this.isEmergency,
      isRecurring: this.isRecurring,
      recurringFrequency: this.recurringFrequency,
      businessId: this.businessId,
      expiresAt: this.expiresAt,
      professionalName: this.professionalName,
    };
  }

  static async findById(id) {
    const data = await getDocumentById(COLLECTIONS.JOBS, id);
    if (!data) return null;
    return new Job(data);
  }

  static async findByCustomer(customerId, limit = 20) {
    const results = await queryDocuments(
      COLLECTIONS.JOBS,
      [{ field: 'customerId', operator: '==', value: customerId }],
      { field: 'createdAt', direction: 'desc' }
    );
    return results.slice(0, limit).map(data => new Job(data));
  }

  static async findByProfessional(professionalId, limit = 20) {
    const results = await queryDocuments(
      COLLECTIONS.JOBS,
      [{ field: 'professionalId', operator: '==', value: professionalId }],
      { field: 'createdAt', direction: 'desc' }
    );
    return results.slice(0, limit).map(data => new Job(data));
  }

  static _normalizeDate(value) {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value.toDate === 'function') return value.toDate();
    if (typeof value === 'number') return new Date(value);
    return null;
  }

  isExpired() {
    const now = new Date();
    const expiresAt = Job._normalizeDate(this.expiresAt);
    if (expiresAt) {
      return expiresAt < now;
    }

    const createdAt = Job._normalizeDate(this.createdAt);
    if (createdAt) {
      return new Date(createdAt.getTime() + 24 * 60 * 60 * 1000) < now;
    }

    return false;
  }

  static async findAvailable(filters = {}) {
    const conditions = [{ field: 'status', operator: '==', value: 'posted' }];

    if (filters.category) {
      conditions.push({ field: 'category', operator: '==', value: filters.category });
    }

    if (filters.urgency) {
      conditions.push({ field: 'urgency', operator: '==', value: filters.urgency });
    }

    const results = await queryDocuments(
      COLLECTIONS.JOBS,
      conditions,
      { field: 'createdAt', direction: 'desc' }
    );

    return results
      .filter((data) => {
        const job = new Job(data);
        return !job.isExpired();
      })
      .map(data => new Job(data));
  }

  static async create(data) {
    if (!data.expiresAt) {
      data.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    const result = await createDocument(COLLECTIONS.JOBS, data);
    return new Job(result);
  }

  async save() {
    const data = this.toJSON();
    delete data.id;
    await updateDocument(COLLECTIONS.JOBS, this.id, data);
    return this;
  }

  async delete() {
    await deleteDocument(COLLECTIONS.JOBS, this.id);
    return true;
  }

  async addQuote(quote) {
    if (!this.quotes) this.quotes = [];
    this.quotes.push(quote);
    this.status = 'quotes_received';
    await this.save();
    return this;
  }

  async acceptQuote(quoteId, professionalName = null) {
    if (this.isExpired()) {
      throw new Error('Cannot accept quote for expired job');
    }
    if (this.acceptedQuoteId) {
      throw new Error('A quote has already been accepted for this job');
    }

    this.acceptedQuoteId = quoteId;
    this.status = 'accepted';
    const quote = this.quotes.find(q => q.id === quoteId);
    if (quote) {
      this.professionalId = quote.professionalId;
      this.finalPrice = quote.price;
    }
    if (professionalName) {
      this.professionalName = professionalName;
    }
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    if (this.quotes && this.quotes.length > 0) {
      this.quotes = this.quotes.map((q) => {
        if (q.id === quoteId) {
          return { ...q, status: 'accepted' };
        }
        if (q.status === 'pending') {
          return { ...q, status: 'rejected' };
        }
        return q;
      });
    }

    await this.save();
    return this;
  }

  async updateStatus(status) {
    this.status = status;
    if (status === 'completed') {
      this.completedDate = new Date();
    }
    await this.save();
    return this;
  }

  async addReview(review) {
    this.review = review;
    await this.save();
    return this;
  }

  async processPayment(method, amount) {
    this.paymentMethod = method;
    this.isPaid = true;
    this.finalPrice = amount;
    await this.save();
    return this;
  }

  isCompleted() {
    return this.status === 'completed';
  }

  isCancelled() {
    return this.status === 'cancelled';
  }

  hasQuotes() {
    return this.quotes && this.quotes.length > 0;
  }

  getAcceptedQuote() {
    if (!this.acceptedQuoteId) return null;
    return this.quotes.find(q => q.id === this.acceptedQuoteId);
  }
}

module.exports = Job;