import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

const expect = chai.expect;
chai.should();
chai.use(chaiAsPromised);

describe('check out async/await', () => {
    it('T1', () => {
        return expect(selectOne(['A'])).to.eventually.become('A' as any);
    });

    it('T2', () => {
        return expect(selectOne(['Z', 'A'])).to.eventually.become('A' as any);
    });

    it('T3', () => {
        return expect(selectOne(['B', 'Z', 'A'], 'Z')).to.eventually.become('Z' as any);
    });

    it('T4', () => {
        return expect(selectOne(['B', 'Z', 'A'], 'Z', 'A')).to.eventually.become('Z' as any);
    });

    it('T5', () => {
        return expect(selectOne(['Z'], 'Z', 'Z')).to.eventually.become(null);
    });

    it('T6', () => {
        return expect(selectOne(['A'], 'Z', 'Z')).to.eventually.become('A' as any);
    });
});

async function selectOne(tags: string[], resolveTag?: string, errorTag?: string): Promise<null | string> {

    let results = [];
    for (let tag of tags) {
        try {
            let result = await (tag === errorTag ? Promise.reject(tag) : Promise.resolve(tag));
            if (tag === resolveTag) {
                return result;
            }
            results.push(result);
        } catch (err) {
            // ignore tag
        }
    }

    results.sort();
    return results.length > 0 ? results[0] : null;
}
