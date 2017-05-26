import {TranslationMessagesFileFactory, ITranslationMessagesFile, ITransUnit, INormalizedMessage, STATE_NEW, STATE_TRANSLATED, STATE_FINAL} from '../api';
import * as fs from "fs";

/**
 * Created by martin on 28.04.2017.
 * Testcases for xmb files.
 */

describe('ngx-i18nsupport-lib xtb test spec', () => {

    let SRCDIR = 'test/testdata/i18n/';

    let ENCODING = 'UTF-8';

    /**
     * Helper function to read Xtb from 2 Files, the xtb and the master
     * @type {string}
     */
    function readFile(path: string, masterPath?: string): ITranslationMessagesFile {
        const content = fs.readFileSync(path, ENCODING);
        if (masterPath) {
            const masterContent = fs.readFileSync(masterPath, ENCODING);
            let optionalMaster = {xmlContent: masterContent, path: masterPath, encoding: ENCODING};
            return TranslationMessagesFileFactory.fromFileContent('xtb', content, path, ENCODING, optionalMaster);
        } else {
            return TranslationMessagesFileFactory.fromFileContent('xtb', content, path, ENCODING, null);
        }
    }

    /**
     * Helper function to read file with unknown format
     * @type {string}
     */
    function readUnknownFormatFile(path: string, masterPath?: string): ITranslationMessagesFile {
        const content = fs.readFileSync(path, ENCODING);
        if (masterPath) {
            const masterContent = fs.readFileSync(masterPath, ENCODING);
            let optionalMaster = {xmlContent: masterContent, path: masterPath, encoding: ENCODING};
            return TranslationMessagesFileFactory.fromUnknownFormatFileContent(content, path, ENCODING, optionalMaster);
        } else {
            return TranslationMessagesFileFactory.fromUnknownFormatFileContent(content, path, ENCODING, null);
        }
    }

    describe('xtb format tests', () => {
        let MASTER_1_XMB = SRCDIR + 'ngExtractedMaster1.xmb';
        let MASTER_DE_XMB = SRCDIR + 'ngExtractedMaster1.de.xmb';
        let TRANSLATION_EN_XTB = SRCDIR + 'ngExtractedMaster1.en.xtb';

        let ID_MY_FIRST = '2047558209369508311'; // an ID from ngExtractedMaster1.xmb
        let ID_WITH_PLACEHOLDER = '9030312858648510700';
        let ID_WITH_MEANING_AND_DESCRIPTION = '3274258156935474372'; // ID with placeholders and source element
        let ID_WITH_NO_SOURCEREFS = 'no_sourceref_test'; // an ID with no source elements
        let ID_WITH_TWO_SOURCEREFS = '4371668001355139802'; // an ID with 2 source elements
        let ID_WITH_LINEBREAK = '7149517499881679376';
        let ID_WITH_TAGS = '7609655310648429098';
        let ID_WITH_TAG_STRANGE = '7610784844464920497';
        let ID_TO_MERGE = 'unittomerge';

        it('should read xtb file', () => {
            const file: ITranslationMessagesFile = readFile(TRANSLATION_EN_XTB);
            expect(file).toBeTruthy();
            expect(file.fileType()).toBe('XTB');
            const tu: ITransUnit = file.transUnitWithId(ID_MY_FIRST);
            expect(tu).toBeTruthy();
            expect(tu.sourceContent()).toBeFalsy();
            expect(tu.targetContent()).toBe('My first I18N Application');
        });

        it('should emit warnings', () => {
            const file: ITranslationMessagesFile = readFile(TRANSLATION_EN_XTB);
            expect(file.warnings().length).toBe(1);
            expect(file.warnings()[0]).toContain('msg without "id"');
        });

        it('should emit warnings, if master does not fit', () => {
            const file: ITranslationMessagesFile = readUnknownFormatFile(TRANSLATION_EN_XTB, MASTER_1_XMB);
            expect(file.warnings().length).toBe(2);
            expect(file.warnings()[0]).toContain('msg without "id"');
            expect(file.warnings()[1]).toContain('Check if it is the correct master');
        });

        it('should count units', () => {
            const file: ITranslationMessagesFile = readFile(TRANSLATION_EN_XTB);
            expect(file.numberOfTransUnits()).toBe(11);
            expect(file.numberOfTransUnitsWithMissingId()).toBe(1);
            expect(file.numberOfUntranslatedTransUnits()).toBe(file.numberOfTransUnits());
            expect(file.numberOfReviewedTransUnits()).toBe(0);
        });

        it('should return source language', () => {
            const file: ITranslationMessagesFile = readFile(TRANSLATION_EN_XTB);
            expect(file.sourceLanguage()).toBeFalsy(); // no master, no source!
            const file2: ITranslationMessagesFile = readFile(TRANSLATION_EN_XTB, MASTER_DE_XMB);
            expect(file2.sourceLanguage()).toBe('de');
        });

        it('should return target language', () => {
            const file: ITranslationMessagesFile = readFile(TRANSLATION_EN_XTB, MASTER_DE_XMB);
            expect(file.targetLanguage()).toBe('en');
        });

        it('should loop over all trans units', () => {
            const translatedFile: ITranslationMessagesFile = readFile(TRANSLATION_EN_XTB, MASTER_DE_XMB);
            let count = 0;
            translatedFile.forEachTransUnit((tu: ITransUnit) => {
                expect(tu).toBeTruthy();
                count++;
            });
            expect(count).toBeGreaterThan(4);
        });

        it('should read meaning and description of tu', () => {
            const file: ITranslationMessagesFile = readFile(TRANSLATION_EN_XTB, MASTER_DE_XMB);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_MEANING_AND_DESCRIPTION);
            expect(tu).toBeTruthy();
            expect(tu.meaning()).toBe('dateservice.monday');
            expect(tu.description()).toBe('ngx-translate');
        });

        it('should ignore source attribute in sourceContent', () => {
            const file: ITranslationMessagesFile = readFile(TRANSLATION_EN_XTB, MASTER_DE_XMB);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_PLACEHOLDER);
            expect(tu).toBeTruthy();
            expect(tu.sourceContent()).toBe('Eintrag <ph name="INTERPOLATION"><ex>INTERPOLATION</ex></ph> von <ph name="INTERPOLATION_1"><ex>INTERPOLATION_1</ex></ph> hinzugefügt.');
        });

        it('should return empty source references array if source not set', () => {
            const file: ITranslationMessagesFile = readFile(TRANSLATION_EN_XTB, MASTER_DE_XMB);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_NO_SOURCEREFS);
            expect(tu).toBeTruthy();
            expect(tu.sourceReferences().length).toBe(0);
        });

        it('should return source reference', () => {
            const file: ITranslationMessagesFile = readFile(TRANSLATION_EN_XTB, MASTER_DE_XMB);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_PLACEHOLDER);
            expect(tu).toBeTruthy();
            expect(tu.sourceReferences().length).toBe(1);
            expect(tu.sourceReferences()[0].sourcefile).toBe('S:/experimente/sampleapp41/src/app/app.component.ts');
            expect(tu.sourceReferences()[0].linenumber).toBe(6);
        });

        it('should return more than one source references', () => {
            const file: ITranslationMessagesFile = readFile(TRANSLATION_EN_XTB, MASTER_DE_XMB);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_TWO_SOURCEREFS);
            expect(tu).toBeTruthy();
            expect(tu.sourceReferences().length).toBe(2);
            expect(tu.sourceReferences()[0].sourcefile).toBe('S:/experimente/sampleapp41/src/app/app.component.ts');
            expect(tu.sourceReferences()[0].linenumber).toBe(2);
            expect(tu.sourceReferences()[1].sourcefile).toBe('S:/experimente/sampleapp41/src/app/app.component.ts');
            expect(tu.sourceReferences()[1].linenumber).toBe(3);
        });

        it('should return source reference with more than 1 linenumber', () => {
            // if the text in template spreads over more than 1 line, there is a linenumber format like 7,8 used
            // in this case, linenumber is the first line (here 7).
            const file: ITranslationMessagesFile = readFile(TRANSLATION_EN_XTB, MASTER_DE_XMB);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_LINEBREAK);
            expect(tu).toBeTruthy();
            expect(tu.sourceReferences().length).toBe(1);
            expect(tu.sourceReferences()[0].sourcefile).toBe('S:/experimente/sampleapp41/src/app/app.component.ts');
            expect(tu.sourceReferences()[0].linenumber).toBe(7);
        });

        it ('should run through 3 different states while translating', () => {
            const file: ITranslationMessagesFile = readFile(TRANSLATION_EN_XTB, MASTER_DE_XMB);
            const tu: ITransUnit = file.transUnitWithId(ID_MY_FIRST);
            expect(tu).toBeTruthy();
            expect(tu.targetState()).toBe(STATE_FINAL);
            tu.translate('a translation');
            // TODO state handling xmb to be improved
            // expect(tu.targetState()).toBe(STATE_TRANSLATED);
            // tu.setTargetState(STATE_FINAL);
            // expect(tu.targetState()).toBe(STATE_FINAL);
        });

        it('should not change source reference when translating', () => {
            const file: ITranslationMessagesFile = readFile(TRANSLATION_EN_XTB, MASTER_DE_XMB);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_TWO_SOURCEREFS);
            expect(tu).toBeTruthy();
            expect(tu.sourceReferences().length).toBe(2);
            tu.translate('a translated value');
            let masterContent = {xmlContent: fs.readFileSync(MASTER_DE_XMB, ENCODING), path: MASTER_DE_XMB, encoding: 'UTF-8'};
            const file2: ITranslationMessagesFile = TranslationMessagesFileFactory.fromUnknownFormatFileContent(file.editedContent(), null, null, masterContent);
            const tu2: ITransUnit = file2.transUnitWithId(ID_WITH_TWO_SOURCEREFS);
            expect(tu2.targetContent()).toBe('a translated value');
            expect(tu2.sourceReferences().length).toBe(2);
            expect(tu2.sourceReferences()[0].sourcefile).toBe('S:/experimente/sampleapp41/src/app/app.component.ts');
            expect(tu2.sourceReferences()[0].linenumber).toBe(2);
            expect(tu2.sourceReferences()[1].sourcefile).toBe('S:/experimente/sampleapp41/src/app/app.component.ts');
            expect(tu2.sourceReferences()[1].linenumber).toBe(3);
        });

        it('should normalize placeholders to {{0}} etc', () => {
            const file: ITranslationMessagesFile = readFile(TRANSLATION_EN_XTB, MASTER_DE_XMB);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_PLACEHOLDER);
            expect(tu.targetContentNormalized().asDisplayString()).toBe('Entry {{0}} of {{1}} added.');
        });

        it('should normalize embedded html tags', () => {
            const file: ITranslationMessagesFile = readFile(TRANSLATION_EN_XTB, MASTER_DE_XMB);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_TAGS);
            expect(tu.targetContentNormalized().asDisplayString()).toBe('This message is <b><strong>VERY IMPORTANT</strong></b>');
        });

        it('should normalize embedded html tags', () => {
            const file: ITranslationMessagesFile = readFile(TRANSLATION_EN_XTB, MASTER_DE_XMB);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_TAG_STRANGE);
            expect(tu.targetContentNormalized().asDisplayString()).toBe('This message is <strange>{{0}}</strange>');
        });

        it('should remove a transunit by id', () => {
            const file: ITranslationMessagesFile = readFile(TRANSLATION_EN_XTB, MASTER_DE_XMB);
            const tu: ITransUnit = file.transUnitWithId(ID_WITH_TWO_SOURCEREFS);
            expect(tu).toBeTruthy();
            file.removeTransUnitWithId(ID_WITH_TWO_SOURCEREFS);
            const file2: ITranslationMessagesFile = TranslationMessagesFileFactory.fromUnknownFormatFileContent(file.editedContent(), null, null);
            const tu2: ITransUnit = file2.transUnitWithId(ID_WITH_TWO_SOURCEREFS);
            expect(tu2).toBeFalsy(); // should not exist any more
        });

        it ('should copy a transunit from file a to file b', () => {
            const file: ITranslationMessagesFile = readUnknownFormatFile(MASTER_1_XMB);
            const tu: ITransUnit = file.transUnitWithId(ID_TO_MERGE);
            expect(tu).toBeTruthy();
            const targetFile: ITranslationMessagesFile = readFile(TRANSLATION_EN_XTB, MASTER_1_XMB);
            expect(targetFile.transUnitWithId(ID_TO_MERGE)).toBeFalsy();
            targetFile.importNewTransUnit(tu, false, true);
            expect(targetFile.transUnitWithId(ID_TO_MERGE)).toBeTruthy();
            let changedTargetFile = TranslationMessagesFileFactory.fromUnknownFormatFileContent(targetFile.editedContent(), null, null);
            let targetTu = changedTargetFile.transUnitWithId(ID_TO_MERGE);
            expect(targetTu.targetContent()).toBe('Test for merging units');
        });

        it ('should translate using NormalizedMessage (plain text case, no placeholders, no markup)', () => {
            const file: ITranslationMessagesFile = readFile(TRANSLATION_EN_XTB, MASTER_DE_XMB);
            const tu: ITransUnit = file.transUnitWithId(ID_MY_FIRST);
            expect(tu).toBeTruthy();
            const translationString = 'Anwendung läuft';
            // first translate
            let translation: INormalizedMessage = tu.sourceContentNormalized().translate(translationString);
            tu.translate(translation);
            expect(tu.targetContent()).toBe(translationString);
            const file2: ITranslationMessagesFile = TranslationMessagesFileFactory.fromUnknownFormatFileContent(file.editedContent(), null, null);
            const tu2: ITransUnit = file2.transUnitWithId(ID_MY_FIRST);
            expect(tu2.targetContentNormalized().asDisplayString()).toBe(translationString);
        });

    });
});
