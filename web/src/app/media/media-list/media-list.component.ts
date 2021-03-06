import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';

import { Logger, Pagination } from '@xapp/shared';
import { Media, MediaService } from '@xapp/media';

@Component({
    selector: 'app-media-list',
    templateUrl: './media-list.component.html',
    styleUrls: ['./media-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MediaListComponent implements OnInit {
    @Input() selection = false;
    @Input() selectable = false;
    @Input() viewable = true;
    @Input() deletable = true;
    @Output() loading: EventEmitter<boolean> = new EventEmitter<boolean>();
    @Output() loaded: EventEmitter<number> = new EventEmitter<number>();

    pagination: Pagination = new Pagination();

    constructor(public store: MediaService,
        private _translate: TranslateService,
        private _router: Router) { }

    ngOnInit() {
        this.load(1);
    }

    reload(): void {
        this.load(this.pagination.page);
    }

    load(page: number): void {
        this.pagination.page = page;

        this.loading.emit(true);
        this.store.load(this.pagination)
            .then(
                () => {
                    this.loading.emit(false);
                    this.loaded.emit(this.store.count);
                },
                (error) => {
                    if (Logger.isEnabled) {
                        Logger.dir(error);
                    }
                    const errMsg: string = this._translate.instant('app.message.error.loading');
                    alert(errMsg);
                    this.loading.emit(false);
                    this.loaded.emit(0);
                }
            );
    }

    imageSource(media: Media) {
        if (media.deleted) {
            return media.selected ? 'icon-radio-checked2' : 'icon-radio-unchecked';
        }
        return media.selected ? 'icon-checkbox-checked' : 'icon-checkbox-unchecked';
    }

    toggleSelection(media: Media) {
        media.selected = !media.selected;
        return;
    }

    delete(media: Media) {
        if (!this.deletable) {
            return;
        }
        const msg: string = this._translate.instant('app.message.confirm.delete');
        if (confirm(msg)) {
            media.deleting = true;

            this.store.delete(media)
                .then(
                    () => {
                        media.deleting = false;
                        media.deleted = true;
                        if (this.pagination.next) {
                            this.reload();
                        }
                    },
                    (error) => {
                        media.deleting = false;
                        if (Logger.isEnabled) {
                            Logger.dir(error);
                        }
                        const errMsg: string = this._translate.instant('app.message.error.deletion');
                        alert(errMsg);
                        this.reload();
                    }
                );
        }
    }

    edit(media: Media): any[] {
        if (!this.viewable || !!!media.id) {
            return ['.'];
        }
        return ['/media', media.id];
    }
}
