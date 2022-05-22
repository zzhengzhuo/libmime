/* eslint no-unused-expressions:0, no-invalid-this:0, quotes: 0 */

'use strict';

const libmime = require('../lib/libmime');
const charset = require('../lib/charset');

const chai = require('chai');
const expect = chai.expect;
chai.config.includeStack = true;

describe('libmime', () => {
    describe('#isPlainText', () => {
        it('should detect plain text', () => {
            expect(libmime.isPlainText('abc')).to.be.true;
            expect(libmime.isPlainText('abc\x02')).to.be.false;
            expect(libmime.isPlainText('abcõ')).to.be.false;
        });
        it('should return true', () => {
            expect(libmime.isPlainText('az09\t\r\n~!?')).to.be.true;
        });

        it('should return false on low bits', () => {
            expect(libmime.isPlainText('az09\n\x08!?')).to.be.false;
        });

        it('should return false on high bits', () => {
            expect(libmime.isPlainText('az09\nõ!?')).to.be.false;
        });
    });

    describe('#hasLongerLines', () => {
        it('should detect longer lines', () => {
            expect(libmime.hasLongerLines('abc\ndef', 5)).to.be.false;
            expect(libmime.hasLongerLines('juf\nabcdef\nghi', 5)).to.be.true;
        });
    });

    describe('#encodeWord', () => {
        it('should encode quoted-printable', () => {
            expect('=?UTF-8?Q?See_on_=C3=B5hin_test?=').to.equal(libmime.encodeWord('See on õhin test'));
        });

        it('should encode base64', () => {
            expect('=?UTF-8?B?U2VlIG9uIMO1aGluIHRlc3Q=?=').to.equal(libmime.encodeWord('See on õhin test', 'B'));
        });
    });

    describe('#encodeWords', () => {
        it('should encode Ascii range', () => {
            let input1 = 'метель" вьюга',
                input2 = "метель'вьюга",
                input3 = 'Verão você vai adorar!',
                output1 = '=?UTF-8?Q?=D0=BC=D0=B5=D1=82=D0=B5=D0=BB=D1=8C=22_?= =?UTF-8?Q?=D0=B2=D1=8C=D1=8E=D0=B3=D0=B0?=',
                output2 = '=?UTF-8?Q?=D0=BC=D0=B5=D1=82=D0=B5=D0=BB=D1=8C=27?= =?UTF-8?Q?=D0=B2=D1=8C=D1=8E=D0=B3=D0=B0?=',
                output3 = '=?UTF-8?Q?Ver=C3=A3o_voc=C3=AA?= vai adorar!';

            expect(libmime.encodeWords(input1, 'Q', 52)).to.equal(output1);
            expect(libmime.encodeWords(input2, 'Q', 52)).to.equal(output2);
            expect(libmime.encodeWords(input3, 'Q', 52)).to.equal(output3);
        });
    });

    describe('#decodeWords', () => {
        it('should decode', () => {
            expect('Hello: See on õhin test').to.equal(libmime.decodeWords('Hello: =?UTF-8?q?See_on_=C3=B5hin_test?='));
            expect('See on õhin test').to.equal(libmime.decodeWords('=?UTF-8?q?See_on_=C3=B5hin_test?='));

            expect(libmime.decodeWords('=?gb2312?B?z/u30czh0NHIq8Pmyf28ti3Dv8jV0MXTw7ncvNK5qcT6x+HLybbU1csswNbP?=\r\n	 =?gb2312?B?7dDFz6Ih?=')).to.equal(
                '消费提醒全面升级-每日信用管家供您轻松对账,乐享信息!'
            );
        });

        it('should decode mime words', () => {
            expect('Jõge-vaŽ zz Jõge-vaŽJõge-vaŽJõge-vaŽ').to.equal(
                libmime.decodeWords(
                    '=?ISO-8859-13?Q?J=F5ge-va=DE?= zz =?ISO-8859-13?Q?J=F5ge-va=DE?= =?ISO-8859-13?Q?J=F5ge-va=DE?= =?ISO-8859-13?Q?J=F5ge-va=DE?='
                )
            );
            expect('Sssś Lałalalala').to.equal(libmime.decodeWords('=?UTF-8?B?U3NzxZsgTGHFgmFsYQ==?= =?UTF-8?B?bGFsYQ==?='));
        });

        it('should decode ascii range', () => {
            let input1 = 'метель" вьюга',
                input2 = "метель'вьюга",
                output1 = '=?UTF-8?Q?=D0=BC=D0=B5=D1=82=D0=B5=D0=BB=D1=8C=22_?= =?UTF-8?Q?=D0=B2=D1=8C=D1=8E=D0=B3=D0=B0?=',
                output2 = "=?UTF-8?Q?=D0=BC=D0=B5=D1=82=D0=B5=D0=BB=D1=8C'?= =?UTF-8?Q?=D0=B2=D1=8C=D1=8E=D0=B3=D0=B0?=";

            expect(libmime.decodeWords(output1)).to.equal(input1);
            expect(libmime.decodeWords(output2)).to.equal(input2);
        });

        it('should join before parsing', () => {
            expect('GLG: Regulation of Taxi in China - 张一兵').to.equal(
                libmime.decodeWords('=?utf-8?B?R0xHOiBSZWd1bGF0aW9uIG9mIFRheGkgaW4gQ2hpbmEgLSDl?= =?utf-8?B?vKDkuIDlhbU=?=')
            );
        });

        it('should join base64 encoding which end with = and decode correctly', () => {
            const input = '=?UTF-8?B?MjAxOSDovrLmm4bmlrDlubTpm7vlrZDos4DljaHlj4rnsL3lkI3mqg==?= =?UTF-8?B?lA==?=';
            expect(libmime.decodeWords(input)).to.equal('2019 農曆新年電子賀卡及簽名檔');
        });

        it('should split QP on maxLength', () => {
            let inputStr = 'Jõgeva Jõgeva Jõgeva mugeva Jõgeva Jõgeva Jõgeva Jõgeva Jõgeva',
                outputStr =
                    '=?UTF-8?Q?J=C3=B5geva_?= =?UTF-8?Q?J=C3=B5geva_?= =?UTF-8?Q?J=C3=B5geva_?= =?UTF-8?Q?mugeva_J?= =?UTF-8?Q?=C3=B5geva_J?= =?UTF-8?Q?=C3=B5geva_J?= =?UTF-8?Q?=C3=B5geva_J?= =?UTF-8?Q?=C3=B5geva_J?= =?UTF-8?Q?=C3=B5geva?=',
                encoded = libmime.encodeWords(inputStr, 'Q', 16);

            expect(outputStr).to.equal(encoded);
            expect(inputStr).to.equal(libmime.decodeWords(encoded));
        });

        it('should split base64 on maxLength', () => {
            let inputStr = 'õõõõõ õõõõõ õõõõõ mugeva õõõõõ õõõõõ õõõõõ õõõõõ Jõgeva',
                outputStr =
                    '=?UTF-8?B?w7XDtcO1w7XDtSA=?= =?UTF-8?B?w7XDtcO1w7XDtSA=?= =?UTF-8?B?w7XDtcO1w7XDtSBt?= =?UTF-8?B?dWdldmEgw7XDtcO1?= =?UTF-8?B?w7XDtSDDtcO1w7U=?= =?UTF-8?B?w7XDtSDDtcO1w7U=?= =?UTF-8?B?w7XDtSDDtcO1w7U=?= =?UTF-8?B?w7XDtSBKw7VnZXZh?=',
                encoded = libmime.encodeWords(inputStr, 'B', 30);

            expect(outputStr).to.equal(encoded);
            expect(inputStr).to.equal(libmime.decodeWords(encoded));
        });

        it('should ignore language param', () => {
            expect('Hello: See on õhin test').to.equal(libmime.decodeWords('Hello: =?UTF-8*EN?q?See_on_=C3=B5hin_test?='));
        });

        it('should handle invalidly split mime words', () => {
            expect('гос (передай кому надо тоже').to.equal(
                libmime.decodeWords(
                    '=?utf-8?Q?=D0=B3=D0=BE=D1=81_?==?utf-8?Q?(=D0=BF=D0=B5=D1=80=D0=B5=\r\n D0=B4=D0=B0=D0=B9_=D0=BA=D0=BE=D0?=\r\n =?utf-8?Q?=BC=D1=83_=D0=BD=D0=B0=D0=B4=D0=BE_=D1=82=D0=BE=D0=B6=D0=B5?='
                )
            );
        });

        it('should decode using jconv module', () => {
            expect(libmime.decodeWords('=?ISO-2022-JP?B?GyRCM1g5OzU7PVEwdzgmPSQ4IUYkMnFKczlwGyhC?=')).to.equal('学校技術員研修検討会報告');
        });

        it('should also decode content empty part', () => {
            expect(libmime.decodeWords('=?UTF-8?Q??= =?UTF-8?Q?=E4=BD=A0=E5=A5=BD?=')).to.equal('你好');
        });
    });

    describe('#decodeSubject', () => {
        it('should decode mime words', () => {
            expect('Jõge-vaŽ zz Jõge-vaŽ Jõge-vaŽ Jõge-vaŽ').to.equal(
                libmime.decodeSubject(
                    '=?ISO-8859-13?Q?J=F5ge-va=DE?= zz =?ISO-8859-13?Q?J=F5ge-va=DE?= =?ISO-8859-13?Q?J=F5ge-va=DE?= =?ISO-8859-13?Q?J=F5ge-va=DE?=',
                    ' '
                )
            );
            expect('Sssś Lałalalala').to.equal(libmime.decodeSubject('=?UTF-8?B?U3NzxZsgTGHFgmFsYQ==?=\r\n =?UTF-8?B?bGFsYQ==?=', ' '));
        });

        it('should decode ascii range', () => {
            let input1 = 'метель"  вьюга',
                input2 = "метель' вьюга",
                output1 = '=?UTF-8?Q?=D0=BC=D0=B5=D1=82=D0=B5=D0=BB=D1=8C=22_?= =?UTF-8?Q?=D0=B2=D1=8C=D1=8E=D0=B3=D0=B0?=',
                output2 = "=?UTF-8?Q?=D0=BC=D0=B5=D1=82=D0=B5=D0=BB=D1=8C'?= =?UTF-8?Q?=D0=B2=D1=8C=D1=8E=D0=B3=D0=B0?=";

            expect(libmime.decodeSubject(output1, ' ')).to.equal(input1);
            expect(libmime.decodeSubject(output2, ' ')).to.equal(input2);
        });

        it('should join base64 encoding which end with = and decode correctly', () => {
            const input = '=?UTF-8?B?MjAxOSAg6L6y5puG5paw5bm0?= =?UTF-8?B?6Zu75a2Q6LOA5Y2h5Y+K57C95ZCN5qqU?=';
            expect(libmime.decodeSubject(input, ' ', true)).to.equal('MjAxOSAg6L6y5puG5paw5bm0 6Zu75a2Q6LOA5Y2h5Y+K57C95ZCN5qqU');
        });
    });

    describe('#buildHeaderParam', () => {
        it('should return unmodified', () => {
            expect([
                {
                    key: 'title',
                    value: 'this is just a title'
                }
            ]).to.deep.equal(libmime.buildHeaderParam('title', 'this is just a title', 500));
        });

        it('should encode and split ascii', () => {
            expect([
                {
                    key: 'title*0',
                    value: 'this '
                },
                {
                    key: 'title*1',
                    value: 'is ju'
                },
                {
                    key: 'title*2',
                    value: 'st a '
                },
                {
                    key: 'title*3',
                    value: 'title'
                }
            ]).to.deep.equal(libmime.buildHeaderParam('title', 'this is just a title', 5));
        });

        it('should encode double byte unicode characters', () => {
            expect([
                {
                    key: 'title*0*',
                    value: "utf-8''Unicode%20title%20%F0%9F%98%8A"
                }
            ]).to.deep.equal(libmime.buildHeaderParam('title', 'Unicode title 😊', 50));
        });

        it('should encode and split unicode', () => {
            expect([
                {
                    key: 'title*0*',
                    value: "utf-8''this%20is%20"
                },
                {
                    key: 'title*1',
                    value: 'just a title '
                },
                {
                    key: 'title*2*',
                    value: '%C3%B5%C3%A4%C3%B6'
                },
                {
                    key: 'title*3*',
                    value: '%C3%BC'
                }
            ]).to.deep.equal(libmime.buildHeaderParam('title', 'this is just a title õäöü', 20));
        });

        it('should encode and split filename with dashes', () => {
            expect([
                {
                    key: 'filename*0*',
                    value: "utf-8''%C6%94------%C6%94------%C6%94------%C6%94"
                },
                {
                    key: 'filename*1*',
                    value: '------%C6%94------%C6%94------%C6%94------.pdf'
                }
            ]).to.deep.equal(libmime.buildHeaderParam('filename', 'Ɣ------Ɣ------Ɣ------Ɣ------Ɣ------Ɣ------Ɣ------.pdf', 50));
        });

        it('should encode and decode', () => {
            let input =
                'Lorěm ipsum doloř siť amet, háš peřpetua compřéhenšam at, ei nám modó soleát éxpétěndá! Boňorum vocibůs dignisšim pro ad, ea sensibus efficiendi intellegam ius. Ad nam aperiam delicata voluptaria, vix nobis luptatum ea, ců úsú graeco viďiššě ňusqúam. ';
            let headerLine =
                'content-disposition: attachment; ' +
                libmime
                    .buildHeaderParam('filename', input, 50)
                    .map(item => item.key + '="' + item.value + '"')
                    .join('; ');
            let parsedHeader = libmime.parseHeaderValue(headerLine);
            expect(input).to.equal(libmime.decodeWords(parsedHeader.params.filename));
        });
    });

    describe('#decodeHeaders', () => {
        it('should decode headers', () => {
            let headersObj = {
                    subject: ['Tere =?UTF-8?Q?J=C3=B5geva?='],
                    'x-app': ['My =?UTF-8?Q?=C5=A1=C5=A1=C5=A1=C5=A1?= app line 1', 'My =?UTF-8?Q?=C5=A1=C5=A1=C5=A1=C5=A1?= app line 2'],
                    'long-line': [
                        'tere =?UTF-8?Q?=C3=B5klva?= karu =?UTF-8?Q?m=C3=B5kva_=C5=A1apaka=C5=A1?= tutikas suur maja, =?UTF-8?Q?k=C3=B5rge?= hoone, segane jutt'
                    ]
                },
                headersStr =
                    'Subject: Tere =?UTF-8?Q?J=C3=B5geva?=\r\n' +
                    'X-APP: My =?UTF-8?Q?=C5=A1=C5=A1=C5=A1=C5=A1?= app line 1\r\n' +
                    'X-APP: My =?UTF-8?Q?=C5=A1=C5=A1=C5=A1=C5=A1?= app line 2\r\n' +
                    'Long-Line: tere =?UTF-8?Q?=C3=B5klva?= karu\r\n' +
                    ' =?UTF-8?Q?m=C3=B5kva_=C5=A1apaka=C5=A1?= tutikas suur maja,\r\n' +
                    ' =?UTF-8?Q?k=C3=B5rge?= hoone, segane jutt';

            expect(headersObj).to.deep.equal(libmime.decodeHeaders(headersStr));
        });
    });

    describe('#parseHeaderValue', () => {
        it('should handle default value only', () => {
            let str = 'text/plain',
                obj = {
                    value: 'text/plain',
                    params: {}
                };

            expect(libmime.parseHeaderValue(str)).to.deep.equal(obj);
        });

        it('should handle unquoted params', () => {
            let str = 'text/plain; CHARSET= UTF-8; format=flowed;',
                obj = {
                    value: 'text/plain',
                    params: {
                        charset: 'UTF-8',
                        format: 'flowed'
                    }
                };

            expect(libmime.parseHeaderValue(str)).to.deep.equal(obj);
        });

        it('should handle quoted params', () => {
            let str = 'text/plain; filename= ";;;\\""; format=flowed;',
                obj = {
                    value: 'text/plain',
                    params: {
                        filename: ';;;"',
                        format: 'flowed'
                    }
                };

            expect(libmime.parseHeaderValue(str)).to.deep.equal(obj);
        });

        it('should handle multi line values', () => {
            let str =
                    'text/plain; single_encoded*="UTF-8\'\'%C3%95%C3%84%C3%96%C3%9C";\n' +
                    " multi_encoded*0*=UTF-8''%C3%96%C3%9C;\n" +
                    ' multi_encoded*1*=%C3%95%C3%84;\n' +
                    ' no_charset*0=OA;\n' +
                    ' no_charset*1=OU;',
                obj = {
                    value: 'text/plain',
                    params: {
                        single_encoded: 'ÕÄÖÜ',
                        multi_encoded: 'ÖÜÕÄ',
                        no_charset: 'OAOU'
                    }
                };

            expect(libmime.parseHeaderValue(str)).to.deep.equal(obj);
        });

        it('should handle params only', () => {
            let str = '; CHARSET= UTF-8; format=flowed;',
                obj = {
                    value: '',
                    params: {
                        charset: 'UTF-8',
                        format: 'flowed'
                    }
                };

            expect(libmime.parseHeaderValue(str)).to.deep.equal(obj);
        });
    });

    describe('#_buildHeaderValue', () => {
        it('should build header value', () => {
            expect(
                libmime.buildHeaderValue({
                    value: 'test'
                })
            ).to.equal('test');
            expect(
                libmime.buildHeaderValue({
                    value: 'test',
                    params: {
                        a: 'b'
                    }
                })
            ).to.equal('test; a=b');
            expect(
                libmime.buildHeaderValue({
                    value: 'test',
                    params: {
                        a: ';'
                    }
                })
            ).to.equal('test; a=";"');
            expect(
                libmime.buildHeaderValue({
                    value: 'test',
                    params: {
                        a: ';"'
                    }
                })
            ).to.equal('test; a=";\\""');
            expect(
                libmime.buildHeaderValue({
                    value: 'test',
                    params: {
                        a: 'b',
                        c: 'd'
                    }
                })
            ).to.equal('test; a=b; c=d');
        });

        it('should handle unicode filename', () => {
            expect(
                libmime.buildHeaderValue({
                    value: 'test',
                    params: {
                        a: 'b',
                        filename: '😁😂 *\'%()<>@,;:\\"[]?=😃😄zzz😊õäöü😓.pdf'
                    }
                })
            ).to.equal(
                "test; a=b; filename*0*=utf-8''%F0%9F%98%81%F0%9F%98%82%20%2A%27%25%28%29; filename*1*=%3C%3E%40%2C%3B%3A%5C%22%5B%5D%3F%3D%F0%9F%98%83; filename*2*=%F0%9F%98%84zzz%F0%9F%98%8A%C3%B5%C3%A4%C3%B6; filename*3*=%C3%BC%F0%9F%98%93.pdf"
            );
        });

        it('should handle dashed filename', () => {
            expect(
                libmime.buildHeaderValue({
                    value: 'test',
                    params: {
                        filename: 'Ɣ------Ɣ------Ɣ------Ɣ------Ɣ------Ɣ------Ɣ------.pdf'
                    }
                })
            ).to.equal("test; filename*0*=utf-8''%C6%94------%C6%94------%C6%94------%C6%94; filename*1*=------%C6%94------%C6%94------%C6%94------.pdf");
        });

        it('should split emoji filename', () => {
            expect(
                libmime.buildHeaderValue({
                    value: 'test',
                    params: {
                        a: 'b',
                        filename: 'Jõge-vaŽJõge-vaŽJõge-vaŽ.pdf'
                    }
                })
            ).to.equal("test; a=b; filename*0*=utf-8''J%C3%B5ge-va%C5%BDJ%C3%B5ge-va%C5%BDJ; filename*1*=%C3%B5ge-va%C5%BD.pdf");
        });

        it('should quote filename with spaces', () => {
            expect(
                libmime.buildHeaderValue({
                    value: 'test',
                    params: {
                        filename: 'document a.pdf'
                    }
                })
            ).to.equal('test; filename="document a.pdf"');
        });

        // For exhaustive list of special characters
        // Refer: https://www.w3.org/Protocols/rfc1341/4_Content-Type.html
        it('should quote filename with special characters', () => {
            // The case of browser downloads when we download multiple files with same name.
            expect(
                libmime.buildHeaderValue({
                    value: 'test',
                    params: {
                        filename: 'receipt(3).pdf'
                    }
                })
            ).to.equal('test; filename="receipt(3).pdf"');

            // For headers which are comma separated as in case of multiple from members elements.
            expect(
                libmime.buildHeaderValue({
                    value: 'test',
                    params: {
                        filename: 'jack,jill.pdf'
                    }
                })
            ).to.equal('test; filename="jack,jill.pdf"');

            // Added support for some more special characters
            let correctString = [
                'space="x y"',
                'small_bracket_open="x(y"',
                'small_bracket_close="x)y"',
                'angle_bracket_open="x<y"',
                'angle_bracket_close="x>y"',
                'at_the_rate="x@y"',
                'semicolon="x;y"',
                'colon="x:y"',
                'back_slash="x\\\\y"',
                'single_quote="x\'y"',
                'double_quotes="x\\"y"',
                'forward_slash="x/y"',
                'big_bracket_open="x[y"',
                'big_bracket_close="x]y"',
                'question_mark="x?y"',
                'comma="x,y"',
                'equals="x=y"',
                'negative_in_mid=x-y',
                'negative_in_start="-x"'
            ].join('; ');

            expect(
                libmime.buildHeaderValue({
                    value: 'test',
                    params: {
                        space: 'x y',
                        small_bracket_open: 'x(y',
                        small_bracket_close: 'x)y',
                        angle_bracket_open: 'x<y',
                        angle_bracket_close: 'x>y',
                        at_the_rate: 'x@y',
                        semicolon: 'x;y',
                        colon: 'x:y',
                        back_slash: 'x\\y',
                        single_quote: "x'y",
                        double_quotes: 'x"y',
                        forward_slash: 'x/y',
                        big_bracket_open: 'x[y',
                        big_bracket_close: 'x]y',
                        question_mark: 'x?y',
                        comma: 'x,y',
                        equals: 'x=y',
                        negative_in_mid: 'x-y',
                        negative_in_start: '-x'
                    }
                })
            ).to.equal('test; ' + correctString);
        });
    });

    describe('#encodeFlowed', () => {
        it('should wrap flowed text', () => {
            let str = 'tere tere tere tere tere tere tere tere tere tere tere tere tere tere tere tere tere tere tere tere\r\nFrom\r\n Hello\r\n> abc\r\nabc',
                folded =
                    'tere tere tere tere tere tere tere tere tere tere tere tere tere tere tere \r\n' +
                    'tere tere tere tere tere\r\n' +
                    ' From\r\n' +
                    '  Hello\r\n' +
                    ' > abc\r\n' +
                    'abc';
            expect(libmime.encodeFlowed(str)).to.equal(folded);
        });
    });

    describe('#decodeFlowed', () => {
        it('should remove soft line breaks', () => {
            let str = 'tere tere tere tere tere tere tere tere tere tere tere tere tere tere tere tere tere tere tere tere\nFrom\n Hello\n> abc\nabc',
                folded =
                    'tere tere tere tere tere tere tere tere tere tere tere tere tere tere tere \r\n' +
                    'tere tere tere tere tere\r\n' +
                    ' From\r\n' +
                    '  Hello\r\n' +
                    ' > abc\r\n' +
                    'abc';
            expect(libmime.decodeFlowed(folded)).to.equal(str);
        });

        it('should remove soft line breaks and spacing', () => {
            let str = 'tere tere tere tere tere tere tere tere tere tere tere tere tere tere teretere tere tere tere tere\nFrom\n Hello\n> abc\nabc',
                folded =
                    'tere tere tere tere tere tere tere tere tere tere tere tere tere tere tere \r\n' +
                    'tere tere tere tere tere\r\n' +
                    ' From\r\n' +
                    '  Hello\r\n' +
                    ' > abc\r\n' +
                    'abc';
            expect(libmime.decodeFlowed(folded, true)).to.equal(str);
        });

        it('should remove SP CRLF before space', () => {
            let str = 'first\nsecond\nthird continued',
                folded = 'first\r\nsecond\r\nthird \r\n continued';
            expect(libmime.decodeFlowed(folded, true)).to.equal(str);
        });

        it('should remove SP CRLF after space', () => {
            let str = 'first\nsecond\nthird continued',
                folded = 'first\r\nsecond\r\nthird  \r\ncontinued';
            expect(libmime.decodeFlowed(folded, true)).to.equal(str);
        });
    });

    describe('#charset', () => {
        describe('#encode', () => {
            it('should encode UTF-8 to Buffer', () => {
                let str = '신',
                    encoded = Buffer.from([0xec, 0x8b, 0xa0]);

                expect(encoded).to.deep.equal(charset.encode(str));
            });
        });

        describe('#decode', () => {
            it('should decode UTF-8 to Buffer', () => {
                let str = '신',
                    encoded = Buffer.from([0xec, 0x8b, 0xa0]);

                expect(str).to.deep.equal(charset.decode(encoded));
            });

            it('should decode non UTF-8 Buffer', () => {
                let str = '신',
                    encoding = 'ks_c_5601-1987',
                    encoded = Buffer.from([0xbd, 0xc5]);

                expect(str).to.deep.equal(charset.decode(encoded, encoding));
            });
        });

        describe('#convert', () => {
            it('should convert non UTF-8 to Buffer', () => {
                let converted = Buffer.from([0xec, 0x8b, 0xa0]),
                    encoding = 'ks_c_5601-1987',
                    encoded = Buffer.from([0xbd, 0xc5]);

                expect(converted).to.deep.equal(charset.convert(encoded, encoding));
            });
        });
    });

    describe('mimetypes', () => {
        describe('#detectExtension', () => {
            it('should find exact match', () => {
                let extension = 'doc',
                    contentType = 'application/msword';

                expect(libmime.detectExtension(contentType)).to.equal(extension);
            });

            it('should find best match', () => {
                let extension = 'jpeg',
                    contentType = 'image/jpeg';

                expect(libmime.detectExtension(contentType)).to.equal(extension);
                expect(libmime.detectExtension('text/plain')).to.equal('txt');
            });

            it('should find default match', () => {
                let extension = 'bin',
                    contentType = 'sugri/mugri';

                expect(libmime.detectExtension(contentType)).to.equal(extension);

                contentType = 'application/octet-stream';

                expect(libmime.detectExtension(contentType)).to.equal(extension);
            });
        });

        describe('#detectMimeType', () => {
            it('should find exact match', () => {
                let extension = 'doc',
                    contentType = 'application/msword';

                expect(libmime.detectMimeType(extension)).to.equal(contentType);
            });

            it('should find best match', () => {
                let extension = 'index.js',
                    contentType = 'application/javascript';

                expect(libmime.detectMimeType(extension)).to.equal(contentType);
            });
        });
    });

    describe('#foldLines', () => {
        it('should Fold long header line', () => {
            let inputStr = 'Subject: Testin command line kirja õkva kakva mõni tõnis kõllas põllas tõllas rõllas jušla kušla tušla musla',
                outputStr =
                    'Subject: Testin command line kirja\r\n' +
                    ' =?UTF-8?Q?=C3=B5kva_kakva_m=C3=B5ni_t=C3=B5nis_k?=\r\n' +
                    ' =?UTF-8?Q?=C3=B5llas_p=C3=B5llas_t=C3=B5llas_r?=\r\n' +
                    ' =?UTF-8?Q?=C3=B5llas_ju=C5=A1la_ku=C5=A1la_tu?= =?UTF-8?Q?=C5=A1la?= musla',
                encodedHeaderLine = libmime.encodeWords(inputStr, 'Q', 52);

            expect(outputStr).to.equal(libmime.foldLines(encodedHeaderLine, 76));
        });

        it('should Fold flowed text', () => {
            let inputStr =
                    'Testin command line kirja õkva kakva mõni tõnis kõllas põllas tõllas rõllas jušla kušla tušla musla Testin command line kirja õkva kakva mõni tõnis kõllas põllas tõllas rõllas jušla kušla tušla musla',
                outputStr =
                    'Testin command line kirja õkva kakva mõni tõnis kõllas põllas tõllas rõllas \r\n' +
                    'jušla kušla tušla musla Testin command line kirja õkva kakva mõni tõnis \r\n' +
                    'kõllas põllas tõllas rõllas jušla kušla tušla musla';

            expect(outputStr).to.equal(libmime.foldLines(inputStr, 76, true));
        });

        it('should fold one long line', () => {
            let inputStr =
                    'Subject: =?UTF-8?Q?=CB=86=C2=B8=C3=81=C3=8C=C3=93=C4=B1=C3=8F=CB=87=C3=81=C3=9B^=C2=B8\\=C3=81=C4=B1=CB=86=C3=8C=C3=81=C3=9B=C3=98^\\=CB=9C=C3=9B=CB=9D=E2=84=A2=CB=87=C4=B1=C3=93=C2=B8^\\=CB=9C=EF=AC=81^\\=C2=B7\\=CB=9C=C3=98^=C2=A3=CB=9C#=EF=AC=81^\\=C2=A3=EF=AC=81^\\=C2=A3=EF=AC=81^\\?=',
                outputStr =
                    'Subject:\r\n =?UTF-8?Q?=CB=86=C2=B8=C3=81=C3=8C=C3=93=C4=B1=C3=8F=CB=87=C3=81=C3=9B^=C2=B8\\=C3=81=C4=B1=CB=86=C3=8C=C3=81=C3=9B=C3=98^\\=CB=9C=C3=9B=CB=9D=E2=84=A2=CB=87=C4=B1=C3=93=C2=B8^\\=CB=9C=EF=AC=81^\\=C2=B7\\=CB=9C=C3=98^=C2=A3=CB=9C#=EF=AC=81^\\=C2=A3=EF=AC=81^\\=C2=A3=EF=AC=81^\\?=';

            expect(outputStr).to.equal(libmime.foldLines(inputStr, 76));
        });
    });
});
