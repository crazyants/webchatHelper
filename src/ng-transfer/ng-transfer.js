import tools from '../tools'
import AirScroll from '../lib/air-scroll'

import './ng-transfer.scss'

class Ctrl {
    constructor($scope, $timeout, $rootScope, $q, $interval, $filter) {
        this.$filter    = $filter
        this.$interval  = $interval
        this.$q         = $q
        this.$timeout   = $timeout
        this.$rootScope = $rootScope
        this.$scope     = $scope
        $scope.ctrl     = this

        this.waitForInit().then(() => {
            this.initList()
            this.account  = tools.getAccount()
            this.NickName = this.account.NickName
            this.groups   = this.fetchGroups()
            this.tab      = Object.keys(this.groups).length ? 1 : 0

            $rootScope.$on('massSms:close', () => {
                this.revertItems()
            })
            $rootScope.safeApply()
        })
    }

    waitForInit() {
        return new Promise((resolve, reject) => {
            let interval = this.$interval(() => {
                if (angular.element('.transfer-list').length) {
                    this.$interval.cancel(interval)
                    resolve()
                }
            }, 100)
        })
    }

    initList() {
        let fromAirScrollConfig = {
            selector    : '.transfer-list:eq(0)',
            itemHeight  : 46,
            showLength  : 8,
            bufferLength: 6,
            $scope      : this.$scope,
            $rootScope  : this.$rootScope,
            $timeout    : this.$timeout
        }
        let toAirScrollConfig   = {
            selector    : '.transfer-list:eq(1)',
            itemHeight  : 46,
            showLength  : 8,
            bufferLength: 6,
            $scope      : this.$scope,
            $rootScope  : this.$rootScope,
            $timeout    : this.$timeout
        }

        this.from = {
            items    : this.$rootScope.weChatHelper.allContacts,
            airScroll: new AirScroll(fromAirScrollConfig)
        }
        this.to   = {
            items    : [],
            airScroll: new AirScroll(toAirScrollConfig)
        }

        this.$scope.$watch(() => this.from.items.length, (newVal) => {
            this.from.airScroll.initItems(this.from.items)
        })

        this.$scope.$watch(() => this.to.items.length, (newVal) => {
            this.to.airScroll.initItems(this.to.items)
        })

        this.$scope.$watch(() => this.from.search, (newVal, oldVal) => {
            if (!oldVal) {
                this.from.backupItems = this.from.items
            }

            this.from.items = this.filterFunc(this.from.backupItems, newVal)
        })

        this.$scope.$watch(() => this.to.search, (newVal, oldVal) => {
            if (!oldVal) {
                this.to.backupItems = this.to.items
            }

            this.to.items = this.filterFunc(this.to.backupItems, newVal)
        })
    }

    revertItems() {
        this.from.items.push(...this.to.items)
        this.from.items.forEach((item) => item.checked = false)
        this.to.items = []
    }

    transfer(fromItems, toItems) {
        for (var i = 0; i < fromItems.length; i++) {
            if (fromItems[i].checked) {
                fromItems[i].checked = false
                toItems.push(...fromItems.splice(i, 1))
                i--
            }
        }
    }

    hasSomeChecked(items) {
        return items && items.some((item) => item.checked)
    }

    filterFunc(items, expected) {
        if (!expected) return items

        return items.filter((item) => {
            let reg = new RegExp(expected, 'ig')
            return reg.test(item.PYInitial)
                || reg.test(item.RemarkPYInitial)
                || reg.test(item.PYQuanPin)
                || reg.test(item.RemarkPYQuanPin)
                || reg.test(item.RemarkName)
                || reg.test(item.NickName)
        })
    }

    saveGroups() {
        let name = prompt('给分组取个名字：')

        if (!name) return

        if (this.groups[name]) {
            if (!confirm(`已有【${name}】分组，要覆盖掉吗？`)) return
        }

        this.groups[name] = this.to.items.map((item) => {
            return {
                NickName  : item.NickName,
                RemarkName: item.RemarkName
            }
        })

        this.writeGroups()
    }

    selectGroup(groupItems) {
        this.revertItems()
        this.from.items.forEach((item) => {
            item.checked = groupItems.some((groupItem) => {
                if (item.RemarkName) {
                    return item.RemarkName === groupItem.RemarkName
                } else {
                    return item.NickName === groupItem.NickName
                }
            })
        })

        this.transfer(this.from.items, this.to.items)
        this.tab = 0
    }

    delGroup(id) {
        window.event.stopPropagation()
        window.event.preventDefault()

        delete this.groups[id]

        this.writeGroups()
    }


    fetchGroups() {
        return JSON.parse(localStorage[`groups_${this.NickName}`] || '{}')
    }

    writeGroups() {
        return localStorage[`groups_${this.NickName}`] = JSON.stringify(this.groups)
    }
}

Ctrl.$inject = ['$scope', '$timeout', '$rootScope', '$q', '$interval', '$filter']


export default Ctrl