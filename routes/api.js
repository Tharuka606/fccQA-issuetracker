'use strict';

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
const client = new MongoClient(MONGO_URI);

module.exports = function (app) {
  app.route('/api/issues/:project')

    // ✅ GET: View issues with optional filters
    .get(async function (req, res) {
      const project = req.params.project;
      const query = req.query;

      try {
        await client.connect();
        const db = client.db('issue_tracker');
        const collection = db.collection(project);

        if (query._id) {
          try {
            query._id = new ObjectId(query._id);
          } catch (e) {
            return res.json({ error: 'invalid id' });
          }
        }

        const issues = await collection.find(query).toArray();
        return res.json(issues);
      } catch (err) {
        console.error(err);
        return res.json({ error: 'could not fetch issues' });
      } finally {
        await client.close();
      }
    })

    // ✅ POST: Create new issue
    .post(async function (req, res) {
      const project = req.params.project;
      const {
        issue_title,
        issue_text,
        created_by,
        assigned_to = '',
        status_text = ''
      } = req.body;

      if (!issue_title || !issue_text || !created_by) {
        return res.json({ error: 'required field(s) missing' });
      }

      const newIssue = {
        issue_title,
        issue_text,
        created_by,
        assigned_to,
        status_text,
        created_on: new Date(),
        updated_on: new Date(),
        open: true
      };

      try {
        await client.connect();
        const db = client.db('issue_tracker');
        const collection = db.collection(project);
        const result = await collection.insertOne(newIssue);
        newIssue._id = result.insertedId;

        return res.json(newIssue);
      } catch (err) {
        console.error(err);
        return res.json({ error: 'could not create issue' });
      } finally {
        await client.close();
      }
    })

    // ✅ PUT: Update an issue
    .put(async function (req, res) {
      const project = req.params.project;
      const { _id, ...fields } = req.body;

      if (!_id) {
        return res.json({ error: 'missing _id' });
      }

      const updates = {};
      Object.keys(fields).forEach(key => {
        if (fields[key] !== '') updates[key] = fields[key];
      });

      if (Object.keys(updates).length === 0) {
        return res.json({ error: 'no update field(s) sent', _id });
      }

      updates.updated_on = new Date();

      try {
        await client.connect();
        const db = client.db('issue_tracker');
        const collection = db.collection(project);
        const result = await collection.updateOne(
          { _id: new ObjectId(_id) },
          { $set: updates }
        );

        if (result.matchedCount === 0) {
          return res.json({ error: 'could not update', _id });
        }

        return res.json({ result: 'successfully updated', _id });
      } catch (err) {
        return res.json({ error: 'could not update', _id });
      } finally {
        await client.close();
      }
    })

    // ✅ DELETE: Delete an issue
    .delete(async function (req, res) {
      const project = req.params.project;
      const { _id } = req.body;

      if (!_id) {
        return res.json({ error: 'missing _id' });
      }

      try {
        await client.connect();
        const db = client.db('issue_tracker');
        const collection = db.collection(project);
        const result = await collection.deleteOne({ _id: new ObjectId(_id) });

        if (result.deletedCount === 0) {
          return res.json({ error: 'could not delete', _id });
        }

        return res.json({ result: 'successfully deleted', _id });
      } catch (err) {
        return res.json({ error: 'could not delete', _id });
      } finally {
        await client.close();
      }
    });
};
