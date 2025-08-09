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
exports.SmartDepartmentExtractor = void 0;
var sharp = require("sharp");
var promises_1 = require("fs/promises");
var path = require("path");
var SmartDepartmentExtractor = /** @class */ (function () {
    function SmartDepartmentExtractor(imagePath, speciesName) {
        // Liste des départements français avec coordonnées précises taggées manuellement
        this.departments = [
            {
                code: '01',
                name: 'Ain',
                region: 'Auvergne-Rhône-Alpes',
                approximateCoords: { x: 0.307692, y: 0.526956 },
            },
            {
                code: '02',
                name: 'Aisne',
                region: 'Hauts-de-France',
                approximateCoords: { x: 0.244983, y: 0.288487 },
            },
            {
                code: '03',
                name: 'Allier',
                region: 'Auvergne-Rhône-Alpes',
                approximateCoords: { x: 0.244147, y: 0.517525 },
            },
            {
                code: '04',
                name: 'Alpes-de-Haute-Provence',
                region: "Provence-Alpes-Côte d'Azur",
                approximateCoords: { x: 0.344482, y: 0.668421 },
            },
            {
                code: '05',
                name: 'Hautes-Alpes',
                region: "Provence-Alpes-Côte d'Azur",
                approximateCoords: { x: 0.348662, y: 0.619919 },
            },
            {
                code: '06',
                name: 'Alpes-Maritimes',
                region: "Provence-Alpes-Côte d'Azur",
                approximateCoords: { x: 0.375418, y: 0.669768 },
            },
            {
                code: '07',
                name: 'Ardèche',
                region: 'Auvergne-Rhône-Alpes',
                approximateCoords: { x: 0.285953, y: 0.633392 },
            },
            {
                code: '08',
                name: 'Ardennes',
                region: 'Grand Est',
                approximateCoords: { x: 0.275084, y: 0.283098 },
            },
            {
                code: '09',
                name: 'Ariège',
                region: 'Occitanie',
                approximateCoords: { x: 0.198161, y: 0.76812 },
            },
            {
                code: '10',
                name: 'Aube',
                region: 'Grand Est',
                approximateCoords: { x: 0.265886, y: 0.377408 },
            },
            {
                code: '11',
                name: 'Aude',
                region: 'Occitanie',
                approximateCoords: { x: 0.226589, y: 0.751953 },
            },
            {
                code: '12',
                name: 'Aveyron',
                region: 'Occitanie',
                approximateCoords: { x: 0.23495, y: 0.671116 },
            },
            {
                code: '13',
                name: 'Bouches-du-Rhône',
                region: "Provence-Alpes-Côte d'Azur",
                approximateCoords: { x: 0.301839, y: 0.706145 },
            },
            {
                code: '14',
                name: 'Calvados',
                region: 'Normandie',
                approximateCoords: { x: 0.134615, y: 0.3316 },
            },
            {
                code: '15',
                name: 'Cantal',
                region: 'Auvergne-Rhône-Alpes',
                approximateCoords: { x: 0.232441, y: 0.607793 },
            },
            {
                code: '16',
                name: 'Charente',
                region: 'Nouvelle-Aquitaine',
                approximateCoords: { x: 0.15301, y: 0.570069 },
            },
            {
                code: '17',
                name: 'Charente-Maritime',
                region: 'Nouvelle-Aquitaine',
                approximateCoords: { x: 0.126254, y: 0.561986 },
            },
            {
                code: '18',
                name: 'Cher',
                region: 'Centre-Val de Loire',
                approximateCoords: { x: 0.222408, y: 0.467676 },
            },
            {
                code: '19',
                name: 'Corrèze',
                region: 'Nouvelle-Aquitaine',
                approximateCoords: { x: 0.204849, y: 0.595668 },
            },
            {
                code: '21',
                name: "Côte-d'Or",
                region: 'Bourgogne-Franche-Comté',
                approximateCoords: { x: 0.382943, y: 0.766773 },
            },
            {
                code: '22',
                name: "Côtes-d'Armor",
                region: 'Bretagne',
                approximateCoords: { x: 0.056856, y: 0.378755 },
            },
            {
                code: '23',
                name: 'Creuse',
                region: 'Nouvelle-Aquitaine',
                approximateCoords: { x: 0.208194, y: 0.543124 },
            },
            {
                code: '24',
                name: 'Dordogne',
                region: 'Nouvelle-Aquitaine',
                approximateCoords: { x: 0.170569, y: 0.611835 },
            },
            {
                code: '25',
                name: 'Doubs',
                region: 'Bourgogne-Franche-Comté',
                approximateCoords: { x: 0.335284, y: 0.446119 },
            },
            {
                code: '26',
                name: 'Drôme',
                region: 'Auvergne-Rhône-Alpes',
                approximateCoords: { x: 0.307692, y: 0.628002 },
            },
            {
                code: '27',
                name: 'Eure',
                region: 'Normandie',
                approximateCoords: { x: 0.173913, y: 0.332947 },
            },
            {
                code: '28',
                name: 'Eure-et-Loir',
                region: 'Centre-Val de Loire',
                approximateCoords: { x: 0.184783, y: 0.378755 },
            },
            {
                code: '29',
                name: 'Finistère',
                region: 'Bretagne',
                approximateCoords: { x: 0.0301, y: 0.392228 },
            },
            {
                code: '30',
                name: 'Gard',
                region: 'Occitanie',
                approximateCoords: { x: 0.284281, y: 0.681894 },
            },
            {
                code: '31',
                name: 'Haute-Garonne',
                region: 'Occitanie',
                approximateCoords: { x: 0.197324, y: 0.725007 },
            },
            {
                code: '32',
                name: 'Gers',
                region: 'Occitanie',
                approximateCoords: { x: 0.165552, y: 0.711534 },
            },
            {
                code: '33',
                name: 'Gironde',
                region: 'Nouvelle-Aquitaine',
                approximateCoords: { x: 0.132943, y: 0.64417 },
            },
            {
                code: '34',
                name: 'Hérault',
                region: 'Occitanie',
                approximateCoords: { x: 0.257525, y: 0.714229 },
            },
            {
                code: '35',
                name: 'Ille-et-Vilaine',
                region: 'Bretagne',
                approximateCoords: { x: 0.097826, y: 0.400312 },
            },
            {
                code: '36',
                name: 'Indre',
                region: 'Centre-Val de Loire',
                approximateCoords: { x: 0.194816, y: 0.493274 },
            },
            {
                code: '37',
                name: 'Indre-et-Loire',
                region: 'Centre-Val de Loire',
                approximateCoords: { x: 0.167224, y: 0.460939 },
            },
            {
                code: '38',
                name: 'Isère',
                region: 'Auvergne-Rhône-Alpes',
                approximateCoords: { x: 0.316054, y: 0.576806 },
            },
            {
                code: '39',
                name: 'Jura',
                region: 'Bourgogne-Franche-Comté',
                approximateCoords: { x: 0.319398, y: 0.483843 },
            },
            {
                code: '40',
                name: 'Landes',
                region: 'Nouvelle-Aquitaine',
                approximateCoords: { x: 0.12291, y: 0.696714 },
            },
            {
                code: '41',
                name: 'Loir-et-Cher',
                region: 'Centre-Val de Loire',
                approximateCoords: { x: 0.190635, y: 0.44073 },
            },
            {
                code: '42',
                name: 'Loire',
                region: 'Auvergne-Rhône-Alpes',
                approximateCoords: { x: 0.273411, y: 0.563333 },
            },
            {
                code: '43',
                name: 'Haute-Loire',
                region: 'Auvergne-Rhône-Alpes',
                approximateCoords: { x: 0.265886, y: 0.606446 },
            },
            {
                code: '44',
                name: 'Loire-Atlantique',
                region: 'Pays de la Loire',
                approximateCoords: { x: 0.099498, y: 0.448814 },
            },
            {
                code: '45',
                name: 'Loiret',
                region: 'Centre-Val de Loire',
                approximateCoords: { x: 0.214047, y: 0.412437 },
            },
            {
                code: '46',
                name: 'Lot',
                region: 'Occitanie',
                approximateCoords: { x: 0.199833, y: 0.64417 },
            },
            {
                code: '47',
                name: 'Lot-et-Garonne',
                region: 'Nouvelle-Aquitaine',
                approximateCoords: { x: 0.165552, y: 0.668421 },
            },
            {
                code: '48',
                name: 'Lozère',
                region: 'Occitanie',
                approximateCoords: { x: 0.260033, y: 0.646864 },
            },
            {
                code: '49',
                name: 'Maine-et-Loire',
                region: 'Pays de la Loire',
                approximateCoords: { x: 0.132107, y: 0.456897 },
            },
            {
                code: '50',
                name: 'Manche',
                region: 'Normandie',
                approximateCoords: { x: 0.108696, y: 0.334295 },
            },
            {
                code: '51',
                name: 'Marne',
                region: 'Grand Est',
                approximateCoords: { x: 0.267559, y: 0.332947 },
            },
            {
                code: '52',
                name: 'Haute-Marne',
                region: 'Grand Est',
                approximateCoords: { x: 0.300167, y: 0.390881 },
            },
            {
                code: '53',
                name: 'Mayenne',
                region: 'Pays de la Loire',
                approximateCoords: { x: 0.126254, y: 0.400312 },
            },
            {
                code: '54',
                name: 'Meurthe-et-Moselle',
                region: 'Grand Est',
                approximateCoords: { x: 0.322742, y: 0.347768 },
            },
            {
                code: '55',
                name: 'Meuse',
                region: 'Grand Est',
                approximateCoords: { x: 0.300167, y: 0.327558 },
            },
            {
                code: '56',
                name: 'Morbihan',
                region: 'Bretagne',
                approximateCoords: { x: 0.063545, y: 0.423215 },
            },
            {
                code: '57',
                name: 'Moselle',
                region: 'Grand Est',
                approximateCoords: { x: 0.331104, y: 0.310044 },
            },
            {
                code: '58',
                name: 'Nièvre',
                region: 'Bourgogne-Franche-Comté',
                approximateCoords: { x: 0.250836, y: 0.467676 },
            },
            {
                code: '59',
                name: 'Nord',
                region: 'Hauts-de-France',
                approximateCoords: { x: 0.242475, y: 0.242679 },
            },
            {
                code: '60',
                name: 'Oise',
                region: 'Hauts-de-France',
                approximateCoords: { x: 0.216555, y: 0.304654 },
            },
            {
                code: '61',
                name: 'Orne',
                region: 'Normandie',
                approximateCoords: { x: 0.148829, y: 0.365282 },
            },
            {
                code: '62',
                name: 'Pas-de-Calais',
                region: 'Hauts-de-France',
                approximateCoords: { x: 0.202341, y: 0.226512 },
            },
            {
                code: '63',
                name: 'Puy-de-Dôme',
                region: 'Auvergne-Rhône-Alpes',
                approximateCoords: { x: 0.243311, y: 0.566027 },
            },
            {
                code: '64',
                name: 'Pyrénées-Atlantiques',
                region: 'Nouvelle-Aquitaine',
                approximateCoords: { x: 0.12709, y: 0.743869 },
            },
            {
                code: '65',
                name: 'Hautes-Pyrénées',
                region: 'Occitanie',
                approximateCoords: { x: 0.156355, y: 0.762731 },
            },
            {
                code: '66',
                name: 'Pyrénées-Orientales',
                region: 'Occitanie',
                approximateCoords: { x: 0.237458, y: 0.785635 },
            },
            {
                code: '67',
                name: 'Bas-Rhin',
                region: 'Grand Est',
                approximateCoords: { x: 0.362876, y: 0.336989 },
            },
            {
                code: '68',
                name: 'Haut-Rhin',
                region: 'Grand Est',
                approximateCoords: { x: 0.359532, y: 0.392228 },
            },
            {
                code: '69',
                name: 'Rhône',
                region: 'Auvergne-Rhône-Alpes',
                approximateCoords: { x: 0.289298, y: 0.552555 },
            },
            {
                code: '70',
                name: 'Haute-Saône',
                region: 'Bourgogne-Franche-Comté',
                approximateCoords: { x: 0.328595, y: 0.408395 },
            },
            {
                code: '71',
                name: 'Saône-et-Loire',
                region: 'Bourgogne-Franche-Comté',
                approximateCoords: { x: 0.281773, y: 0.495969 },
            },
            {
                code: '72',
                name: 'Sarthe',
                region: 'Pays de la Loire',
                approximateCoords: { x: 0.15301, y: 0.407048 },
            },
            {
                code: '73',
                name: 'Savoie',
                region: 'Auvergne-Rhône-Alpes',
                approximateCoords: { x: 0.348662, y: 0.567375 },
            },
            {
                code: '74',
                name: 'Haute-Savoie',
                region: 'Auvergne-Rhône-Alpes',
                approximateCoords: { x: 0.34699, y: 0.521567 },
            },
            {
                code: '75',
                name: 'Paris',
                region: 'Île-de-France',
                approximateCoords: { x: 0.214047, y: 0.343726 },
            },
            {
                code: '76',
                name: 'Seine-Maritime',
                region: 'Normandie',
                approximateCoords: { x: 0.173913, y: 0.28714 },
            },
            {
                code: '77',
                name: 'Seine-et-Marne',
                region: 'Île-de-France',
                approximateCoords: { x: 0.229933, y: 0.357198 },
            },
            {
                code: '78',
                name: 'Yvelines',
                region: 'Île-de-France',
                approximateCoords: { x: 0.199833, y: 0.350462 },
            },
            {
                code: '79',
                name: 'Deux-Sèvres',
                region: 'Nouvelle-Aquitaine',
                approximateCoords: { x: 0.13796, y: 0.521567 },
            },
            {
                code: '80',
                name: 'Somme',
                region: 'Hauts-de-France',
                approximateCoords: { x: 0.201505, y: 0.265583 },
            },
            {
                code: '81',
                name: 'Tarn',
                region: 'Occitanie',
                approximateCoords: { x: 0.2199, y: 0.704798 },
            },
            {
                code: '82',
                name: 'Tarn-et-Garonne',
                region: 'Occitanie',
                approximateCoords: { x: 0.191472, y: 0.685936 },
            },
            {
                code: '83',
                name: 'Var',
                region: "Provence-Alpes-Côte d'Azur",
                approximateCoords: { x: 0.349498, y: 0.712881 },
            },
            {
                code: '84',
                name: 'Vaucluse',
                region: "Provence-Alpes-Côte d'Azur",
                approximateCoords: { x: 0.315217, y: 0.677852 },
            },
            {
                code: '85',
                name: 'Vendée',
                region: 'Pays de la Loire',
                approximateCoords: { x: 0.11204, y: 0.508094 },
            },
            {
                code: '86',
                name: 'Vienne',
                region: 'Nouvelle-Aquitaine',
                approximateCoords: { x: 0.163043, y: 0.52022 },
            },
            {
                code: '87',
                name: 'Haute-Vienne',
                region: 'Nouvelle-Aquitaine',
                approximateCoords: { x: 0.185619, y: 0.56468 },
            },
            {
                code: '88',
                name: 'Vosges',
                region: 'Grand Est',
                approximateCoords: { x: 0.338629, y: 0.374713 },
            },
            {
                code: '89',
                name: 'Yonne',
                region: 'Bourgogne-Franche-Comté',
                approximateCoords: { x: 0.248328, y: 0.417826 },
            },
            {
                code: '90',
                name: 'Territoire de Belfort',
                region: 'Bourgogne-Franche-Comté',
                approximateCoords: { x: 0.351171, y: 0.413784 },
            },
            {
                code: '91',
                name: 'Essonne',
                region: 'Île-de-France',
                approximateCoords: { x: 0.212375, y: 0.366629 },
            },
            {
                code: '92',
                name: 'Hauts-de-Seine',
                region: 'Île-de-France',
                approximateCoords: { x: 0.473244, y: 0.788329 },
            },
            {
                code: '93',
                name: 'Seine-Saint-Denis',
                region: 'Île-de-France',
                approximateCoords: { x: 0.494983, y: 0.808538 },
            },
            {
                code: '94',
                name: 'Val-de-Marne',
                region: 'Île-de-France',
                approximateCoords: { x: 0.476589, y: 0.834137 },
            },
            {
                code: '95',
                name: "Val-d'Oise",
                region: 'Île-de-France',
                approximateCoords: { x: 0.228261, y: 0.320822 },
            },
        ];
        this.imagePath =
            imagePath ||
                path.join(process.cwd(), 'images', 'plan-actions-chiropteres.fr-barbastelle-deurope-carte-barbastelle-deurope-2048x1271.png');
        this.speciesName = speciesName || "Barbastelle d'Europe";
    }
    SmartDepartmentExtractor.prototype.extractDepartmentDistribution = function () {
        return __awaiter(this, void 0, void 0, function () {
            var image, _a, data, info, departmentMappings, _i, _b, department, mapping, withColor, statusStats, _c, _d, _e, status_1, count;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        console.log("\uD83D\uDDFA\uFE0F  Extraction intelligente des d\u00E9partements avec distribution");
                        console.log("\uD83E\uDD87 Esp\u00E8ce: ".concat(this.speciesName));
                        console.log('==========================================================');
                        console.log('📊 Analyse de la carte de distribution...');
                        image = sharp(this.imagePath);
                        return [4 /*yield*/, image
                                .raw()
                                .toBuffer({ resolveWithObject: true })];
                    case 1:
                        _a = _f.sent(), data = _a.data, info = _a.info;
                        console.log("\uD83D\uDCD0 Dimensions: ".concat(info.width, "x").concat(info.height, "px"));
                        departmentMappings = [];
                        _i = 0, _b = this.departments;
                        _f.label = 2;
                    case 2:
                        if (!(_i < _b.length)) return [3 /*break*/, 5];
                        department = _b[_i];
                        console.log("\uD83D\uDD0D Analyse ".concat(department.name, " (").concat(department.code, ")..."));
                        return [4 /*yield*/, this.analyzeDepartmentRegion(data, info.width, info.height, department)];
                    case 3:
                        mapping = _f.sent();
                        departmentMappings.push(mapping);
                        if (mapping.dominantColor) {
                            console.log("  \u2705 ".concat(department.name, ": ").concat(mapping.dominantColor.hex, " - ").concat(mapping.distributionStatus));
                        }
                        else {
                            console.log("  \u26A0\uFE0F  ".concat(department.name, ": Aucune couleur significative d\u00E9tect\u00E9e"));
                        }
                        _f.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: 
                    // Sauvegarder les résultats
                    return [4 /*yield*/, this.saveDetailedResults(departmentMappings)];
                    case 6:
                        // Sauvegarder les résultats
                        _f.sent();
                        console.log("\n🎯 RÉSUMÉ DE L'EXTRACTION:");
                        console.log('===========================');
                        withColor = departmentMappings.filter(function (d) { return d.dominantColor; });
                        console.log("\u2705 D\u00E9partements avec couleur d\u00E9tect\u00E9e: ".concat(withColor.length, "/101"));
                        console.log("\u26A0\uFE0F  D\u00E9partements sans couleur: ".concat(departmentMappings.length - withColor.length, "/101"));
                        statusStats = new Map();
                        withColor.forEach(function (d) {
                            statusStats.set(d.distributionStatus, (statusStats.get(d.distributionStatus) || 0) + 1);
                        });
                        console.log('\n📊 Répartition par statut de distribution:');
                        for (_c = 0, _d = Array.from(statusStats.entries()); _c < _d.length; _c++) {
                            _e = _d[_c], status_1 = _e[0], count = _e[1];
                            console.log("  ".concat(status_1, ": ").concat(count, " d\u00E9partements"));
                        }
                        return [2 /*return*/, departmentMappings];
                }
            });
        });
    };
    SmartDepartmentExtractor.prototype.analyzeDepartmentRegion = function (imageData, width, height, department) {
        return __awaiter(this, void 0, void 0, function () {
            var centerX, centerY, radius, colorCounts, y, x, pixelIndex, r, g, b, colorKey, dominantColor, maxCount, _i, _a, _b, colorKey, count, components, r, g, b, distributionStatus;
            return __generator(this, function (_c) {
                centerX = Math.floor(department.approximateCoords.x * width);
                centerY = Math.floor(department.approximateCoords.y * height);
                radius = 30;
                colorCounts = new Map();
                for (y = Math.max(0, centerY - radius); y < Math.min(height, centerY + radius); y++) {
                    for (x = Math.max(0, centerX - radius); x < Math.min(width, centerX + radius); x++) {
                        pixelIndex = (y * width + x) * 3;
                        r = imageData[pixelIndex];
                        g = imageData[pixelIndex + 1];
                        b = imageData[pixelIndex + 2];
                        // Ignorer le blanc pur et le noir pur
                        if ((r === 255 && g === 255 && b === 255) ||
                            (r === 0 && g === 0 && b === 0)) {
                            continue;
                        }
                        colorKey = "".concat(r, ",").concat(g, ",").concat(b);
                        colorCounts.set(colorKey, (colorCounts.get(colorKey) || 0) + 1);
                    }
                }
                dominantColor = null;
                maxCount = 0;
                for (_i = 0, _a = Array.from(colorCounts.entries()); _i < _a.length; _i++) {
                    _b = _a[_i], colorKey = _b[0], count = _b[1];
                    if (count > maxCount && count > 10) {
                        components = colorKey.split(',').map(Number);
                        if (components.length !== 3)
                            continue;
                        r = components[0];
                        g = components[1];
                        b = components[2];
                        // Vérifier que les composants sont des nombres valides
                        if (typeof r !== 'number' ||
                            typeof g !== 'number' ||
                            typeof b !== 'number' ||
                            isNaN(r) ||
                            isNaN(g) ||
                            isNaN(b))
                            continue;
                        dominantColor = {
                            r: r,
                            g: g,
                            b: b,
                            hex: "#".concat(r.toString(16).padStart(2, '0')).concat(g.toString(16).padStart(2, '0')).concat(b.toString(16).padStart(2, '0')),
                        };
                        maxCount = count;
                    }
                }
                distributionStatus = dominantColor
                    ? this.inferDistributionStatus(dominantColor)
                    : 'non détecté';
                return [2 /*return*/, {
                        department: department,
                        dominantColor: dominantColor,
                        distributionStatus: distributionStatus,
                        pixelCount: maxCount,
                    }];
            });
        });
    };
    SmartDepartmentExtractor.prototype.inferDistributionStatus = function (color) {
        var r = color.r, g = color.g, b = color.b;
        // Correspondance approximative avec la légende basée sur les couleurs observées
        // Vert clair (#96cb9d): espèce assez commune à très commune
        if (r >= 140 && r <= 160 && g >= 190 && g <= 210 && b >= 150 && b <= 170) {
            return 'assez commune à très commune';
        }
        // Vert jaunâtre (#dce7b1): espèce peu commune ou localement commune
        if (r >= 210 && r <= 230 && g >= 220 && g <= 240 && b >= 170 && b <= 190) {
            return 'peu commune ou localement commune';
        }
        // Orange (#f7a926): espèce rare ou assez rare
        if (r >= 240 && r <= 255 && g >= 160 && g <= 180 && b >= 30 && b <= 50) {
            return 'rare ou assez rare';
        }
        // Gris: espèce présente mais mal connue
        if (r >= 170 && r <= 190 && g >= 170 && g <= 190 && b >= 170 && b <= 190) {
            return 'présente mais mal connue';
        }
        // Rouge: très rarement inventoriée
        if (r >= 200 && g <= 100 && b <= 100) {
            return 'très rarement inventoriée';
        }
        return 'statut à déterminer';
    };
    SmartDepartmentExtractor.prototype.saveDetailedResults = function (mappings) {
        return __awaiter(this, void 0, void 0, function () {
            var results, outputFilename;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        results = {
                            metadata: {
                                extractionDate: new Date().toISOString(),
                                totalDepartments: mappings.length,
                                detectedDepartments: mappings.filter(function (m) { return m.dominantColor; }).length,
                                sourceMap: "Barbastelle d'Europe - Distribution Atlas",
                            },
                            departments: mappings.map(function (mapping) { return ({
                                code: mapping.department.code,
                                name: mapping.department.name,
                                region: mapping.department.region,
                                coordinates: mapping.department.approximateCoords,
                                color: mapping.dominantColor,
                                distributionStatus: mapping.distributionStatus,
                                pixelCount: mapping.pixelCount,
                                confidence: mapping.pixelCount > 50
                                    ? 'high'
                                    : mapping.pixelCount > 20
                                        ? 'medium'
                                        : 'low',
                            }); }),
                            summary: {
                                byStatus: this.groupByStatus(mappings),
                                byRegion: this.groupByRegion(mappings),
                            },
                        };
                        outputFilename = path.join(process.cwd(), 'output', "".concat(this.speciesName
                            .toLowerCase()
                            .replace(/\s+/g, '-')
                            .replace(/[^a-z0-9-]/g, ''), "-department-extraction.json"));
                        return [4 /*yield*/, (0, promises_1.writeFile)(outputFilename, JSON.stringify(results, null, 2))];
                    case 1:
                        _a.sent();
                        console.log("\uD83D\uDCBE R\u00E9sultats d\u00E9taill\u00E9s sauvegard\u00E9s dans: ".concat(outputFilename));
                        return [2 /*return*/];
                }
            });
        });
    };
    SmartDepartmentExtractor.prototype.groupByStatus = function (mappings) {
        var statusCount = {};
        mappings.forEach(function (mapping) {
            statusCount[mapping.distributionStatus] =
                (statusCount[mapping.distributionStatus] || 0) + 1;
        });
        return statusCount;
    };
    SmartDepartmentExtractor.prototype.groupByRegion = function (mappings) {
        var regionCount = {};
        mappings
            .filter(function (m) { return m.dominantColor; })
            .forEach(function (mapping) {
            regionCount[mapping.department.region] =
                (regionCount[mapping.department.region] || 0) + 1;
        });
        return regionCount;
    };
    SmartDepartmentExtractor.prototype.cleanup = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    return SmartDepartmentExtractor;
}());
exports.SmartDepartmentExtractor = SmartDepartmentExtractor;
// Script principal
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var extractor, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    extractor = new SmartDepartmentExtractor();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 6]);
                    return [4 /*yield*/, extractor.extractDepartmentDistribution()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 3:
                    error_1 = _a.sent();
                    console.error("❌ Erreur lors de l'extraction:", error_1);
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, extractor.cleanup()];
                case 5:
                    _a.sent();
                    console.log('🧹 Nettoyage terminé');
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    });
}
if (require.main === module) {
    main();
}
