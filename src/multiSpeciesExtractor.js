"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiSpeciesExtractor = void 0;
var fs_1 = require("fs");
var path = require("path");
var smartExtractor_1 = require("./smartExtractor");
/**
 * Extracteur multi-espèces qui traite automatiquement toutes les cartes
 * dans le dossier /images et extrait les données de distribution par département
 */
var MultiSpeciesExtractor = /** @class */ (function () {
    function MultiSpeciesExtractor() {
        this.imagesPath = path.join(process.cwd(), 'images');
        this.outputPath = path.join(process.cwd(), 'output');
    }
    /**
     * Extrait le nom de l'espèce depuis le nom du fichier
     */
    MultiSpeciesExtractor.prototype.extractSpeciesName = function (filename) {
        // Enlever l'extension
        var nameWithoutExt = filename.replace(/\.(png|jpg|jpeg)$/i, '');
        // Patterns pour extraire le nom de l'espèce
        var patterns = [
            // Pattern: plan-actions-chiropteres.fr-barbastelle-deurope-carte-barbastelle-deurope-2048x1271
            /plan-actions-chiropteres\.fr-([^-]+(?:-[^-]+)*)-carte/i,
            // Pattern: plan-actions-chiropteres.fr-carte-grand-murin-carte-grand-murin-2048x1271
            /plan-actions-chiropteres\.fr-carte-([^-]+(?:-[^-]+)*)-carte/i,
            // Pattern général: quelque-chose-ESPECE-quelque-chose
            /carte-([^-]+(?:-[^-]+)*)-carte/i,
            // Pattern de fallback: tout ce qui ressemble à un nom d'espèce
            /([a-z]+-[a-z]+(?:-[a-z]+)*)/i,
        ];
        for (var _i = 0, patterns_1 = patterns; _i < patterns_1.length; _i++) {
            var pattern = patterns_1[_i];
            var match = nameWithoutExt.match(pattern);
            if (match && match[1]) {
                return this.formatSpeciesName(match[1]);
            }
        }
        // Si aucun pattern ne marche, utiliser le nom du fichier nettoyé
        return this.formatSpeciesName(nameWithoutExt);
    };
    /**
     * Formate le nom de l'espèce pour l'affichage
     */
    MultiSpeciesExtractor.prototype.formatSpeciesName = function (rawName) {
        return rawName
            .split('-')
            .map(function (word) { return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(); })
            .join(' ');
    };
    /**
     * Scanne le dossier images et retourne la liste des fichiers à traiter
     */
    MultiSpeciesExtractor.prototype.getImageFiles = function () {
        return __awaiter(this, void 0, void 0, function () {
            var files, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fs_1.promises.readdir(this.imagesPath)];
                    case 1:
                        files = _a.sent();
                        return [2 /*return*/, files.filter(function (file) {
                                return /\.(png|jpg|jpeg)$/i.test(file) &&
                                    !file.startsWith('.') &&
                                    file !== 'README.md';
                            })];
                    case 2:
                        error_1 = _a.sent();
                        console.error('❌ Erreur lors de la lecture du dossier images:', error_1);
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Crée le dossier de résultats s'il n'existe pas
     */
    MultiSpeciesExtractor.prototype.ensureOutputDir = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fs_1.promises.mkdir(this.outputPath, { recursive: true })];
                    case 1:
                        _b.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        _a = _b.sent();
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Traite une seule image/espèce
     */
    MultiSpeciesExtractor.prototype.processSpecies = function (filename) {
        return __awaiter(this, void 0, void 0, function () {
            var speciesName, imagePath, extractor, results, outputFile, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        speciesName = this.extractSpeciesName(filename);
                        imagePath = path.join(this.imagesPath, filename);
                        console.log("\n\uD83E\uDD87 Traitement de l'esp\u00E8ce: ".concat(speciesName));
                        console.log("\uD83D\uDCC1 Image: ".concat(filename));
                        console.log('='.repeat(80));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        extractor = new smartExtractor_1.SmartDepartmentExtractor(imagePath, speciesName);
                        return [4 /*yield*/, extractor.extractDepartmentDistribution()];
                    case 2:
                        results = _a.sent();
                        outputFile = path.join(this.outputPath, "".concat(speciesName.toLowerCase().replace(/\s+/g, '-'), "-distribution.json"));
                        return [4 /*yield*/, fs_1.promises.writeFile(outputFile, JSON.stringify(results, null, 2), 'utf8')];
                    case 3:
                        _a.sent();
                        console.log("\u2705 Extraction termin\u00E9e pour ".concat(speciesName));
                        console.log("\uD83D\uDCBE R\u00E9sultats sauvegard\u00E9s: ".concat(outputFile));
                        return [4 /*yield*/, extractor.cleanup()];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        error_2 = _a.sent();
                        console.error("\u274C Erreur lors du traitement de ".concat(speciesName, ":"), error_2);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Génère un rapport consolidé de toutes les espèces
     */
    MultiSpeciesExtractor.prototype.generateConsolidatedReport = function () {
        return __awaiter(this, void 0, void 0, function () {
            var resultFiles, distributionFiles, consolidatedData, _loop_1, this_1, _i, distributionFiles_1, file, reportPath, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        return [4 /*yield*/, fs_1.promises.readdir(this.outputPath)];
                    case 1:
                        resultFiles = _a.sent();
                        distributionFiles = resultFiles.filter(function (file) {
                            return file.endsWith('-distribution.json');
                        });
                        consolidatedData = {
                            metadata: {
                                extractionDate: new Date().toISOString(),
                                totalSpecies: distributionFiles.length,
                                source: 'Multi-species extraction from plan-actions-chiropteres.fr',
                            },
                            species: [],
                        };
                        _loop_1 = function (file) {
                            var filePath, data, _b, _c, speciesName, departmentsArray, detectedDepartments, summary_1, error_4;
                            return __generator(this, function (_d) {
                                switch (_d.label) {
                                    case 0:
                                        _d.trys.push([0, 2, , 3]);
                                        filePath = path.join(this_1.outputPath, file);
                                        _c = (_b = JSON).parse;
                                        return [4 /*yield*/, fs_1.promises.readFile(filePath, 'utf8')];
                                    case 1:
                                        data = _c.apply(_b, [_d.sent()]);
                                        speciesName = file
                                            .replace('-distribution.json', '')
                                            .split('-')
                                            .map(function (word) { return word.charAt(0).toUpperCase() + word.slice(1); })
                                            .join(' ');
                                        departmentsArray = Array.isArray(data) ? data : [];
                                        detectedDepartments = departmentsArray.filter(function (d) { return d.distributionStatus !== 'non détecté'; }).length;
                                        summary_1 = {};
                                        departmentsArray.forEach(function (dept) {
                                            var status = dept.distributionStatus || 'non détecté';
                                            summary_1[status] = (summary_1[status] || 0) + 1;
                                        });
                                        consolidatedData.species.push({
                                            name: speciesName,
                                            filename: file,
                                            totalDepartments: departmentsArray.length,
                                            detectedDepartments: detectedDepartments,
                                            summary: summary_1,
                                        });
                                        return [3 /*break*/, 3];
                                    case 2:
                                        error_4 = _d.sent();
                                        console.warn("\u26A0\uFE0F  Impossible de lire ".concat(file, ":"), error_4);
                                        return [3 /*break*/, 3];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _i = 0, distributionFiles_1 = distributionFiles;
                        _a.label = 2;
                    case 2:
                        if (!(_i < distributionFiles_1.length)) return [3 /*break*/, 5];
                        file = distributionFiles_1[_i];
                        return [5 /*yield**/, _loop_1(file)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        reportPath = path.join(this.outputPath, 'consolidated-species-report.json');
                        return [4 /*yield*/, fs_1.promises.writeFile(reportPath, JSON.stringify(consolidatedData, null, 2), 'utf8')];
                    case 6:
                        _a.sent();
                        console.log("\n\uD83D\uDCCA Rapport consolid\u00E9 g\u00E9n\u00E9r\u00E9: ".concat(reportPath));
                        // Afficher un résumé
                        console.log('\n🦇 RÉSUMÉ MULTI-ESPÈCES:');
                        console.log('='.repeat(50));
                        consolidatedData.species.forEach(function (species) {
                            console.log("".concat(species.name, ":"));
                            console.log("  \uD83D\uDCCA D\u00E9partements d\u00E9tect\u00E9s: ".concat(species.detectedDepartments, "/").concat(species.totalDepartments));
                            if (species.summary && Object.keys(species.summary).length > 0) {
                                Object.entries(species.summary).forEach(function (_a) {
                                    var status = _a[0], count = _a[1];
                                    console.log("  ".concat(status, ": ").concat(count, " d\u00E9partements"));
                                });
                            }
                            console.log('');
                        });
                        return [3 /*break*/, 8];
                    case 7:
                        error_3 = _a.sent();
                        console.error('❌ Erreur lors de la génération du rapport consolidé:', error_3);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Lance l'extraction pour toutes les espèces
     */
    MultiSpeciesExtractor.prototype.extractAllSpecies = function () {
        return __awaiter(this, void 0, void 0, function () {
            var imageFiles, _i, imageFiles_1, filename;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("🚀 Démarrage de l'extraction multi-espèces");
                        console.log('🔍 Recherche des cartes dans le dossier /images...');
                        return [4 /*yield*/, this.ensureOutputDir()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.getImageFiles()];
                    case 2:
                        imageFiles = _a.sent();
                        if (imageFiles.length === 0) {
                            console.log('❌ Aucune image trouvée dans le dossier /images');
                            return [2 /*return*/];
                        }
                        console.log("\uD83D\uDCF8 ".concat(imageFiles.length, " carte(s) trouv\u00E9e(s):"));
                        imageFiles.forEach(function (file) {
                            var speciesName = _this.extractSpeciesName(file);
                            console.log("  - ".concat(file, " \u2192 ").concat(speciesName));
                        });
                        _i = 0, imageFiles_1 = imageFiles;
                        _a.label = 3;
                    case 3:
                        if (!(_i < imageFiles_1.length)) return [3 /*break*/, 6];
                        filename = imageFiles_1[_i];
                        return [4 /*yield*/, this.processSpecies(filename)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6: 
                    // Générer le rapport consolidé
                    return [4 /*yield*/, this.generateConsolidatedReport()];
                    case 7:
                        // Générer le rapport consolidé
                        _a.sent();
                        console.log('\n🎉 Extraction multi-espèces terminée !');
                        console.log("\uD83D\uDCC1 Tous les r\u00E9sultats sont dans: ".concat(this.outputPath));
                        return [2 /*return*/];
                }
            });
        });
    };
    return MultiSpeciesExtractor;
}());
exports.MultiSpeciesExtractor = MultiSpeciesExtractor;
// Script principal
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var extractor;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    extractor = new MultiSpeciesExtractor();
                    return [4 /*yield*/, extractor.extractAllSpecies()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
if (require.main === module) {
    main().catch(console.error);
}
