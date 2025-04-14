const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

let testId;

suite('Functional Tests', function() {

  const endpoint = '/api/issues/test';

  // #1 - Create issue with every field
  test('Create an issue with every field', function(done) {
    chai.request(server)
      .post(endpoint)
      .send({
        issue_title: 'Full issue',
        issue_text: 'Text for full issue',
        created_by: 'Tester',
        assigned_to: 'Dev1',
        status_text: 'In QA'
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.body.issue_title, 'Full issue');
        assert.equal(res.body.issue_text, 'Text for full issue');
        assert.equal(res.body.created_by, 'Tester');
        assert.equal(res.body.assigned_to, 'Dev1');
        assert.equal(res.body.status_text, 'In QA');
        assert.property(res.body, '_id');
        testId = res.body._id;
        done();
      });
  });

  // #2 - Create issue with only required fields
  test('Create an issue with only required fields', function(done) {
    chai.request(server)
      .post(endpoint)
      .send({
        issue_title: 'Minimal issue',
        issue_text: 'Just text',
        created_by: 'Tester'
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.body.issue_title, 'Minimal issue');
        assert.equal(res.body.assigned_to, '');
        assert.equal(res.body.status_text, '');
        done();
      });
  });

  // #3 - Create issue with missing required fields
  test('Create an issue with missing required fields', function(done) {
    chai.request(server)
      .post(endpoint)
      .send({
        issue_title: '',
        issue_text: '',
        created_by: ''
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'required field(s) missing' });
        done();
      });
  });

  // #4 - View issues on a project
  test('View issues on a project', function(done) {
    chai.request(server)
      .get(endpoint)
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        done();
      });
  });

  // #5 - View issues with one filter
  test('View issues on a project with one filter', function(done) {
    chai.request(server)
      .get(endpoint)
      .query({ created_by: 'Tester' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        assert.exists(res.body[0].created_by);
        done();
      });
  });

  // #6 - View issues with multiple filters
  test('View issues on a project with multiple filters', function(done) {
    chai.request(server)
      .get(endpoint)
      .query({ created_by: 'Tester', open: true })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        done();
      });
  });

  // #7 - Update one field
  test('Update one field on an issue', function(done) {
    chai.request(server)
      .put(endpoint)
      .send({
        _id: testId,
        status_text: 'Updated'
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { result: 'successfully updated', _id: testId });
        done();
      });
  });

  // #8 - Update multiple fields
  test('Update multiple fields on an issue', function(done) {
    chai.request(server)
      .put(endpoint)
      .send({
        _id: testId,
        status_text: 'More updated',
        assigned_to: 'Dev2'
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { result: 'successfully updated', _id: testId });
        done();
      });
  });

  // #9 - Update missing _id
  test('Update an issue with missing _id', function(done) {
    chai.request(server)
      .put(endpoint)
      .send({
        issue_text: 'Missing ID'
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'missing _id' });
        done();
      });
  });

  // #10 - Update no fields
  test('Update an issue with no fields to update', function(done) {
    chai.request(server)
      .put(endpoint)
      .send({
        _id: testId
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'no update field(s) sent', _id: testId });
        done();
      });
  });

  // #11 - Update with invalid _id
  test('Update an issue with an invalid _id', function(done) {
    chai.request(server)
      .put(endpoint)
      .send({
        _id: 'invalidid123',
        issue_text: 'Trying update'
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'could not update', _id: 'invalidid123' });
        done();
      });
  });

  // #12 - Delete an issue
  test('Delete an issue', function(done) {
    chai.request(server)
      .delete(endpoint)
      .send({ _id: testId })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { result: 'successfully deleted', _id: testId });
        done();
      });
  });

  // #13 - Delete invalid _id
  test('Delete an issue with invalid _id', function(done) {
    chai.request(server)
      .delete(endpoint)
      .send({ _id: 'invalidid123' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'could not delete', _id: 'invalidid123' });
        done();
      });
  });

  // #14 - Delete missing _id
  test('Delete an issue with missing _id', function(done) {
    chai.request(server)
      .delete(endpoint)
      .send({})
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'missing _id' });
        done();
      });
  });

});
