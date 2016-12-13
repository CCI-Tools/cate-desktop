import {updateObject, updateProperty, stateReducer} from './reducers';
import * as actions from './actions';
import {should} from 'chai';
import {Activity, State} from "./state";
import {Action} from 'redux';

should();

describe('updateObject()', function () {

    it('works', function () {
        updateObject({}, {})
            .should.deep.equal({});
        updateObject({}, {a: 2, b: 'Hi'})
            .should.deep.equal({a: 2, b: 'Hi'});
    });
});


describe('updateProperty()', function () {

    it('works', function () {
        updateProperty({}, 'a', {x: 1, y:2})
            .should.deep.equal({a: {x: 1, y:2}});
        updateProperty({a: {y: 3, z: 4}}, 'a', {x: 1, y:2})
            .should.deep.equal({a: {x: 1, y:2, z: 4}});
    });
});

describe('reducer', function () {

    it('updates activities', function () {
        // initial state
        let newState = stateReducer(undefined, {} as Action);
        newState.control.activities.should.deep.equal([]);

        // 1st activity
        let activity : Activity = {jobId:42, title:"Title42",  progress: 0.3};
        newState = stateReducer({} as State, {type: actions.UPDATE_ACTIVITY, payload: {activity}});
        newState.control.activities.should.deep.equal([ { jobId: 42, title: 'Title42', progress: 0.3 } ]);

        // 2nd activity
        activity = {jobId:44, title:"Title44",  progress: 0.2};
        newState = stateReducer(newState, {type: actions.UPDATE_ACTIVITY, payload: {activity}});
        newState.control.activities.should.deep.equal(
            [ { jobId: 42, title: 'Title42', progress: 0.3 },
            { jobId: 44, title: 'Title44', progress: 0.2 } ]);

        // update title and progress in 1st activity
        activity = {jobId:42, title:"Title42b",  progress: 0.6};
        newState = stateReducer(newState, {type: actions.UPDATE_ACTIVITY, payload: {activity}});
        newState.control.activities.should.deep.equal(
            [ { jobId: 42, title: 'Title42b', progress: 0.6 },
                { jobId: 44, title: 'Title44', progress: 0.2 } ]);

        // update only progress
        activity = {jobId:42, progress: 0.8};
        newState = stateReducer(newState, {type: actions.UPDATE_ACTIVITY, payload: {activity}});
        newState.control.activities.should.deep.equal(
            [ { jobId: 42, title: 'Title42b', progress: 0.8 },
                { jobId: 44, title: 'Title44', progress: 0.2 } ]);

        // add message to 1st activity
        activity = {jobId:42, progress: 0.8, messages : ["msg1"]};
        newState = stateReducer(newState, {type: actions.UPDATE_ACTIVITY, payload: {activity}});
        newState.control.activities.should.deep.equal(
            [ { jobId: 42, title: 'Title42b', progress: 0.8, messages : ["msg1"]},
                { jobId: 44, title: 'Title44', progress: 0.2 } ]);

        // add another message to 1st activity
        activity = {jobId:42, progress: 0.8, messages : ["msg2"]};
        newState = stateReducer(newState, {type: actions.UPDATE_ACTIVITY, payload: {activity}});
        newState.control.activities.should.deep.equal(
            [ { jobId: 42, title: 'Title42b', progress: 0.8, messages : ["msg1", "msg2"]},
                { jobId: 44, title: 'Title44', progress: 0.2 } ]);
    });
});
