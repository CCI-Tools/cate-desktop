import {updateObject, updateProperty, stateReducer} from './reducers';
import * as actions from './actions';
import {should} from 'chai';
import {Activity, State} from "./state";

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

describe('update activities', function () {

    it('works', function () {
        let activity : Activity = {jobId:42, title:"Title42",  progress: 0.3};
        let newState = stateReducer({} as State, {type: actions.UPDATE_ACTIVITY, payload: {activity}});
        newState.data.activities.should.deep.equal([ { jobId: 42, title: 'Title42', progress: 0.3 } ]);

        activity = {jobId:44, title:"Title44",  progress: 0.2};
        newState = stateReducer(newState, {type: actions.UPDATE_ACTIVITY, payload: {activity}});
        newState.data.activities.should.deep.equal(
            [ { jobId: 42, title: 'Title42', progress: 0.3 },
            { jobId: 44, title: 'Title44', progress: 0.2 } ]);

        activity = {jobId:42, title:"Title42b",  progress: 0.6};
        newState = stateReducer(newState, {type: actions.UPDATE_ACTIVITY, payload: {activity}});
        newState.data.activities.should.deep.equal(
            [ { jobId: 42, title: 'Title42b', progress: 0.6 },
                { jobId: 44, title: 'Title44', progress: 0.2 } ]);

        // TODO update messages
    });
});
