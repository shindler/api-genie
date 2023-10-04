const { it, before, after } = require('mocha');
const { spec } = require('pactum');

const devServer = require('../devServerHelper');

let __SERVER__;

context.only('api-genie classic handlers', () => {
    before((done) => {
        __SERVER__ = devServer({
            mocksRootPath: 'dev/mocks/',
            beVerbose: false,
        });

        done();
    });

    after(() => {
        __SERVER__.close();
    })

    context('handler: top most index', () => {

        const API_LOCATION = 'http://localhost:3000/apiWithTopMostIndex';

        context('when mock exits', () => {

            context('mock decides to handle the request', () => {
                it('should get response', async () => {
                    await spec()
                        .get(`${API_LOCATION}/`)
                        .expectStatus(200)
                        .expectHeader('x-apigenie-mock-used', 'apiWithTopMostIndex/index.js');
                });
            });

            context('mock decides not to handle the request', () => {
                it('should get 404 response', async () => {
                    // given: we ask the mock not to handle the request
                    await spec()
                        .get(`${API_LOCATION}/?notHandle`)
                        .expectStatus(404);
                });
            });
        });

    });

    context('handler: specific folder index', () => {

        const API_LOCATION = 'http://localhost:3000/apiWithFolderSpecificIndices';

        context('when mock exits', () => {

            context('mock decides to handle the request', () => {
                it('should get response (case: 1st level nested folder)', async () => {
                    await spec()
                        .get(`${API_LOCATION}/parent`)
                        .expectStatus(200)
                        .expectHeader('x-apigenie-mock-used', 'apiWithFolderSpecificIndices/parent/index.js');
                });

                it('should get response (case: deep level nested folder)', async () => {
                    await spec()
                        .get(`${API_LOCATION}/parent/child`)
                        .expectStatus(200)
                        .expectHeader('x-apigenie-mock-used', 'apiWithFolderSpecificIndices/parent/child/index.js');
                });
            });

            context('mock decides not to handle the request', () => {
                it('should get response (case: 1st level nested folder)', async () => {
                    await spec()
                        .get(`${API_LOCATION}/parent`)
                        .expectStatus(200)
                        .expectHeader('x-apigenie-mock-used', 'apiWithFolderSpecificIndices/parent/index.js');
                });

                it('should get response (case: deep level nested folder)', async () => {
                    await spec()
                        .get(`${API_LOCATION}/parent/child`)
                        .expectStatus(200)
                        .expectHeader('x-apigenie-mock-used', 'apiWithFolderSpecificIndices/parent/child/index.js');
                });
            });
        });

        context('when mock does not exists', () => {
            it('should get 404 response', async () => {
                await spec()
                    .get(`${API_LOCATION}/noMocks`)
                    .expectStatus(404);
            });

        });

    });

    context('handler: HTTP method-specific dynamic mock', () => {

        const API_LOCATION = 'http://localhost:3000/apiWithDynamicMocks';

        context('when mock exits', () => {

            context('mock decides to handle the request', () => {
                it('should get response (case: GET)', async () => {
                    await spec()
                        .get(`${API_LOCATION}/`)
                        .expectStatus(200)
                        .expectHeader('x-apigenie-mock-used', 'apiWithDynamicMocks/GET.js');
                });

                it('should get response (case: POST)', async () => {
                    await spec()
                        .post(`${API_LOCATION}/`)
                        .expectStatus(200)
                        .expectHeader('x-apigenie-mock-used', 'apiWithDynamicMocks/POST.js');
                });

                it('should get response (case: DELETE)', async () => {
                    await spec()
                        .delete(`${API_LOCATION}/`)
                        .expectStatus(200)
                        .expectHeader('x-apigenie-mock-used', 'apiWithDynamicMocks/DELETE.js');
                });

                it('should get response (case: PUT)', async () => {
                    await spec()
                        .put(`${API_LOCATION}/`)
                        .expectStatus(200)
                        .expectHeader('x-apigenie-mock-used', 'apiWithDynamicMocks/PUT.js');
                });
            });

            context('mock decides not to handle the request', () => {
                it('should get response (case: GET)', async () => {
                    await spec()
                        .get(`${API_LOCATION}/?notHandle`)
                        .expectStatus(404);
                });

                it('should get response (case: POST)', async () => {
                    await spec()
                        .post(`${API_LOCATION}/?notHandle`)
                        .expectStatus(404);
                });

                it('should get response (case: DELETE)', async () => {
                    await spec()
                        .delete(`${API_LOCATION}/?notHandle`)
                        .expectStatus(404);
                });

                it('should get response (case: PUT)', async () => {
                    await spec()
                        .put(`${API_LOCATION}/?notHandle`)
                        .expectStatus(404);
                });
            });
        });

        context('when mock does not exists', () => {
            it('should get response (case: GET)', async () => {
                await spec()
                    .get(`${API_LOCATION}/`)
                    .expectStatus(200)
                    .expectHeader('x-apigenie-mock-used', 'apiWithDynamicMocks/GET.js');
            });

            it('should get response (case: POST)', async () => {
                await spec()
                    .post(`${API_LOCATION}/`)
                    .expectStatus(200)
                    .expectHeader('x-apigenie-mock-used', 'apiWithDynamicMocks/POST.js');
            });

            it('should get response (case: DELETE)', async () => {
                await spec()
                    .delete(`${API_LOCATION}/`)
                    .expectStatus(200)
                    .expectHeader('x-apigenie-mock-used', 'apiWithDynamicMocks/DELETE.js');
            });

            it('should get response (case: PUT)', async () => {
                await spec()
                    .put(`${API_LOCATION}/`)
                    .expectStatus(200)
                    .expectHeader('x-apigenie-mock-used', 'apiWithDynamicMocks/PUT.js');
            });
        });
    });

    context('handler: HTTP method-specific static mocks', () => {

        const API_LOCATION = `http://localhost:3000/apiWithStaticMocks`;

        context('when mock exits', () => {

            it('should get response (case: top-level)', async () => {
                await spec()
                    .get(`${API_LOCATION}/`)
                    .expectStatus(200)
                    .expectHeader('x-apigenie-mock-used', 'apiWithStaticMocks/GET.json');
            });

            it('should get response (case: 1st level nested folder)', async () => {
                await spec()
                    .get(`${API_LOCATION}/parent/`)
                    .expectStatus(200)
                    .expectHeader('x-apigenie-mock-used', 'apiWithStaticMocks/parent/GET.json');
            });

            it('should get response(case: deep level nested folder)', async () => {
                await spec()
                    .get(`${API_LOCATION}/parent/child/`)
                    .expectStatus(200)
                    .expectHeader('x-apigenie-mock-used', 'apiWithStaticMocks/parent/child/GET.json');
            });
        });

        context('when mock does not exists', () => {
            it('should get 404 (case: no mock at all)', async () => {
                await spec()
                    .get(`${API_LOCATION}/noMocks/`)
                    .expectStatus(404);
            });

            it('should get 404 response (case: no method-specific mock; top-level)', async () => {
                await spec()
                    .post(`${API_LOCATION}/`)
                    .expectStatus(404);
            });

            it('should get 404 response (case: no method-specific mock; 1st level nested folders)', async () => {
                await spec()
                    .post(`${API_LOCATION}/parent/`)
                    .expectStatus(404);
            });

            it('should get 404 response (case: no method-specific mock; deeper level nested folders)', async () => {
                await spec()
                    .post(`${API_LOCATION}/parent/child/`)
                    .expectStatus(404);
            });
        });
    });


});

context('api-genie classic handlers with subsets', () => {

    context('handler: top most index', () => {

        const API_LOCATION = 'http://localhost:3000/apiWithTopMostIndex';

        context('when mock exits', () => {

            context('mock decides to handle the request', () => {
                it('should get response', async () => {
                    await spec()
                        .get(`${API_LOCATION}/`)
                        .withHeaders('x-apigenie-subset', 'exampleSubset')
                        .expectStatus(200)
                        .expectHeader('x-apigenie-mock-used', 'apiWithTopMostIndex/index.js');
                });
            });

            context('mock decides not to handle the request', () => {
                it('should get 404 response', async () => {
                    // given: we ask the mock not to handle the request
                    await spec()
                        .withHeaders('x-apigenie-subset', 'exampleSubset')
                        .get(`${API_LOCATION}/?notHandle`)
                        .expectStatus(404);
                });
            });
        });

    });

    context('handler: specific folder index', () => {

        const API_LOCATION = 'http://localhost:3000/apiWithFolderSpecificIndices';

        context('when mock exits', () => {

            context('mock decides to handle the request', () => {
                it('should get response (case: 1st level nested folder)', async () => {
                    await spec()
                        .get(`${API_LOCATION}/parent`)
                        .expectStatus(200)
                        .expectHeader('x-apigenie-mock-used', 'apiWithFolderSpecificIndices/parent/index.js');
                });

                it('should get response (case: deep level nested folder)', async () => {
                    await spec()
                        .get(`${API_LOCATION}/parent/child`)
                        .expectStatus(200)
                        .expectHeader('x-apigenie-mock-used', 'apiWithFolderSpecificIndices/parent/child/index.js');
                });
            });

            context('mock decides not to handle the request', () => {
                it('should get response (case: 1st level nested folder)', async () => {
                    await spec()
                        .get(`${API_LOCATION}/parent`)
                        .expectStatus(200)
                        .expectHeader('x-apigenie-mock-used', 'apiWithFolderSpecificIndices/parent/index.js');
                });

                it('should get response (case: deep level nested folder)', async () => {
                    await spec()
                        .get(`${API_LOCATION}/parent/child`)
                        .expectStatus(200)
                        .expectHeader('x-apigenie-mock-used', 'apiWithFolderSpecificIndices/parent/child/index.js');
                });
            });
        });

        context('when mock does not exists', () => {
            it('should get 404 response', async () => {
                await spec()
                    .get(`${API_LOCATION}/noMocks`)
                    .expectStatus(404);
            });

        });

    });

    context('handler: HTTP method-specific dynamic mock', () => {

        const API_LOCATION = 'http://localhost:3000/apiWithDynamicMocks';

        context('when mock exits', () => {

            context('mock decides to handle the request', () => {
                it('should get response (case: GET)', async () => {
                    await spec()
                        .get(`${API_LOCATION}/`)
                        .expectStatus(200)
                        .expectHeader('x-apigenie-mock-used', 'apiWithDynamicMocks/GET.js');
                });

                it('should get response (case: POST)', async () => {
                    await spec()
                        .post(`${API_LOCATION}/`)
                        .expectStatus(200)
                        .expectHeader('x-apigenie-mock-used', 'apiWithDynamicMocks/POST.js');
                });

                it('should get response (case: DELETE)', async () => {
                    await spec()
                        .delete(`${API_LOCATION}/`)
                        .expectStatus(200)
                        .expectHeader('x-apigenie-mock-used', 'apiWithDynamicMocks/DELETE.js');
                });

                it('should get response (case: PUT)', async () => {
                    await spec()
                        .put(`${API_LOCATION}/`)
                        .expectStatus(200)
                        .expectHeader('x-apigenie-mock-used', 'apiWithDynamicMocks/PUT.js');
                });
            });

            context('mock decides not to handle the request', () => {
                it('should get response (case: GET)', async () => {
                    await spec()
                        .get(`${API_LOCATION}/?notHandle`)
                        .expectStatus(404);
                });

                it('should get response (case: POST)', async () => {
                    await spec()
                        .post(`${API_LOCATION}/?notHandle`)
                        .expectStatus(404);
                });

                it('should get response (case: DELETE)', async () => {
                    await spec()
                        .delete(`${API_LOCATION}/?notHandle`)
                        .expectStatus(404);
                });

                it('should get response (case: PUT)', async () => {
                    await spec()
                        .put(`${API_LOCATION}/?notHandle`)
                        .expectStatus(404);
                });
            });
        });

        context('when mock does not exists', () => {
            it('should get response (case: GET)', async () => {
                await spec()
                    .get(`${API_LOCATION}/`)
                    .expectStatus(200)
                    .expectHeader('x-apigenie-mock-used', 'apiWithDynamicMocks/GET.js');
            });

            it('should get response (case: POST)', async () => {
                await spec()
                    .post(`${API_LOCATION}/`)
                    .expectStatus(200)
                    .expectHeader('x-apigenie-mock-used', 'apiWithDynamicMocks/POST.js');
            });

            it('should get response (case: DELETE)', async () => {
                await spec()
                    .delete(`${API_LOCATION}/`)
                    .expectStatus(200)
                    .expectHeader('x-apigenie-mock-used', 'apiWithDynamicMocks/DELETE.js');
            });

            it('should get response (case: PUT)', async () => {
                await spec()
                    .put(`${API_LOCATION}/`)
                    .expectStatus(200)
                    .expectHeader('x-apigenie-mock-used', 'apiWithDynamicMocks/PUT.js');
            });
        });
    });

    context('handler: HTTP method-specific static mocks', () => {

        const API_LOCATION = `http://localhost:3000/apiWithStaticMocks`;

        context('when mock exits', () => {

            it('should get response (case: top-level)', async () => {
                await spec()
                    .get(`${API_LOCATION}/`)
                    .expectStatus(200)
                    .expectHeader('x-apigenie-mock-used', 'apiWithStaticMocks/GET.json');
            });

            it('should get response (case: 1st level nested folder)', async () => {
                await spec()
                    .get(`${API_LOCATION}/parent/`)
                    .expectStatus(200)
                    .expectHeader('x-apigenie-mock-used', 'apiWithStaticMocks/parent/GET.json');
            });

            it('should get response(case: deep level nested folder)', async () => {
                await spec()
                    .get(`${API_LOCATION}/parent/child/`)
                    .expectStatus(200)
                    .expectHeader('x-apigenie-mock-used', 'apiWithStaticMocks/parent/child/GET.json');
            });
        });

        context('when mock does not exists', () => {
            it('should get 404 (case: no mock at all)', async () => {
                await spec()
                    .get(`${API_LOCATION}/noMocks/`)
                    .expectStatus(404);
            });

            it('should get 404 response (case: no method-specific mock; top-level)', async () => {
                await spec()
                    .post(`${API_LOCATION}/`)
                    .expectStatus(404);
            });

            it('should get 404 response (case: no method-specific mock; 1st level nested folders)', async () => {
                await spec()
                    .post(`${API_LOCATION}/parent/`)
                    .expectStatus(404);
            });

            it('should get 404 response (case: no method-specific mock; deeper level nested folders)', async () => {
                await spec()
                    .post(`${API_LOCATION}/parent/child/`)
                    .expectStatus(404);
            });
        });
    });


});

context('api-genie dynamic segments handler', () => {
    before((done) => {
        __SERVER__ = devServer({
            mocksRootPath: 'dev/mocks/',
            beVerbose: false,
        });

        done();
    });

    after(() => {
        __SERVER__.close();
    })

    it('should get response from specific method static mock within a dynamic segments path (case: there is no exact match)', async () => {
        await spec()
            .get('http://localhost:3000/api/withAny/ANY_MATCH/static')
            .expectStatus(200)
            .expectHeader('x-apigenie-mock-used', 'api/withAny/%any/static/GET.json')
            .expectJsonMatchStrict({
                "staticMock": true,
                "noSubset": true
            });
    });

    it('should get response from specific method static mock within a dynamic segments path (case: direct hit)', async () => {
        await spec()
            .get('http://localhost:3000/api/withAny/exactMatch/static')
            .expectStatus(200)
            .expectHeader('x-apigenie-mock-used', 'api/withAny/exactMatch/static/GET.json')
            .expectJsonMatchStrict({
                "staticMock": true,
                "noSubset": true
            });
    });

    it('should get response from specific method dynamic mock within a dynamic segments path with valid dynamic paths resolution (case: there is no exact match)', async () => {
        await spec()
            .get('http://localhost:3000/api/withAny/ANY_MATCH/dynamic/FAKE_ID/')
            .expectStatus(200)
            .expectHeader('x-apigenie-mock-used', 'api/withAny/%any/dynamic/%any/GET.js')
            .expectJsonMatchStrict({
                "dynamicMock": true,
                "paramsMap": {
                    "parentId": {
                        "value": "ANY_MATCH",
                        "segmentIndex": 3,
                        "paramIndex": 0,
                        "effectivePath": "api/withAny/%any/"
                    },
                    "@0": {
                        "value": "ANY_MATCH",
                        "segmentIndex": 3,
                        "paramIndex": 0,
                        "effectivePath": "api/withAny/%any/"
                    },
                    "staticId": {
                        "value": "FAKE_ID",
                        "segmentIndex": 5,
                        "paramIndex": 1,
                        "effectivePath": "api/withAny/%any/dynamic/%any/"
                    },
                    "@1": {
                        "value": "FAKE_ID",
                        "segmentIndex": 5,
                        "paramIndex": 1,
                        "effectivePath": "api/withAny/%any/dynamic/%any/"
                    }
                },
                "paramsOrdered": [
                    {
                        "value": "ANY_MATCH",
                        "segmentIndex": 3,
                        "paramIndex": 0,
                        "effectivePath": "api/withAny/%any/"
                    },
                    {
                        "value": "FAKE_ID",
                        "segmentIndex": 5,
                        "paramIndex": 1,
                        "effectivePath": "api/withAny/%any/dynamic/%any/"
                    }
                ]
            });
    });

    it('should get response from specific method dynamic mock within a dynamic segments path with valid dynamic paths resolution (case: there is no exact match)', async () => {
        await spec()
            .get('http://localhost:3000/api/withAny/ANY_MATCH/dynamic/exactMatch/')
            .expectStatus(200)
            .expectHeader('x-apigenie-mock-used', 'api/withAny/%any/dynamic/exactMatch/GET.js')
            .expectJsonMatchStrict({
                "dynamicMock": true,
                "paramsMap": {
                    "parentId": {
                        "value": "ANY_MATCH",
                        "segmentIndex": 3,
                        "paramIndex": 0,
                        "effectivePath": "api/withAny/%any/"
                    },
                    "@0": {
                        "value": "ANY_MATCH",
                        "segmentIndex": 3,
                        "paramIndex": 0,
                        "effectivePath": "api/withAny/%any/"
                    },
                    "staticId": {
                        "value": "exactMatch",
                        "segmentIndex": 5,
                        "paramIndex": 1,
                        "effectivePath": "api/withAny/%any/dynamic/exactMatch/"
                    },
                    "@1": {
                        "value": "exactMatch",
                        "segmentIndex": 5,
                        "paramIndex": 1,
                        "effectivePath": "api/withAny/%any/dynamic/exactMatch/"
                    }
                },
                "paramsOrdered": [
                    {
                        "value": "ANY_MATCH",
                        "segmentIndex": 3,
                        "paramIndex": 0,
                        "effectivePath": "api/withAny/%any/"
                    },
                    {
                        "value": "exactMatch",
                        "segmentIndex": 5,
                        "paramIndex": 1,
                        "effectivePath": "api/withAny/%any/dynamic/exactMatch/"
                    }
                ]
            });
    });
});

