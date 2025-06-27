import { h, ref } from "vue";
import { NInput, NButton, NSpace, NIcon } from "naive-ui";
import { SearchOutline } from "@vicons/ionicons5";

export function createColumns(rawColumns, searchFn = null) {
  const columns = [];
  let tableWidth = 0;
  let index = 0;
  for (let item of Array.isArray(rawColumns) ? rawColumns : []) {
    if (item.width) {
      tableWidth = tableWidth + item.width;
    } else {
      tableWidth = tableWidth + 100;
    }

    if (item.customAction && item.customAction == true) {
      columns.push(item);
      continue;
    }

    const temp = { ...item };
    if (item.render) {
      temp.render = item.render;
    }
    temp.title = item.title ? item.title : "";
    temp.key = item.key ? item.key : "";
    temp.className = "!text-slate-500 text-center";
    if (item.width) temp.width = item.width;
    temp.resizable = true;
    if (item.resizable) {
      temp.resizable = item.resizable;
    }
    temp.sorter = true;
    if (item.sorter) {
      temp.sorter = item.sorter;
    }
    temp.align = "left";
    if (item.align) {
      temp.align = item.align;
    }

    if (item.type === "date") {
      const key = temp.key;
      temp.render = ({ row }) => {
        const value = row?.[key];
        if (!value) return "";
        const date = new Date(value);
        return isNaN(date.getTime()) ? "" : date.toLocaleDateString();
      };
    }

    if (item.type && item.type === "amount") {
      temp.render = ({row}) => {
        return row.taxAmount?.toLocaleString?.() ?? '';
      }
    }

    if (item.filter && item.filter === true) {
      // ✅ 반응형으로 선언해야 입력이 정상적으로 반영됨!
      const filterValue = ref(null);
      temp.filter = true;
      temp.filterOptionValue = null;
      temp.renderFilterIcon = () => {
        const active = !!filterValue.value;
        return h(
          NIcon,
          {
            class: active ? "text-blue-500" : "text-slate-300",
          },
          { default: () => h(SearchOutline) }
        );
      };
      temp.renderFilterMenu = ({ hide }) => {
        // const inputRef = ref(null);
        // nextTick(() => {
        //   if (inputRef.value) {
        //     inputRef.value.focus();
        //   }
        // });
        return h(
          NSpace,
          {
            style: { padding: "3px", width: "300px" },
            vertical: true,
            size: 0,
          },
          {
            default: () => [
              h(NInput, {
                // ref: inputRef,
                placeholder: "",
                value: filterValue.value, // 입력값 유지
                "onUpdate:value": (value) => {
                  // ✅ Naive UI에서 올바른 이벤트 사용
                  filterValue.value = value; // ✅ 필터 값 업데이트
                  if (value === "") {
                    filterValue.value = null;
                  }
                },
                clearable: true, // ✅ Clear 버튼 추가
                onClear: () => {
                  // ✅ 사용자가 Clear 버튼 (X) 클릭 시
                  filterValue.value = null; // ✅ 필터 값 초기화
                  temp.filterOptionValue = filterValue.value;
                  if (searchFn) {
                    searchFn();
                  }
                  hide(); // ✅ 필터 메뉴 닫기
                },
                onKeyup: (event) => {
                  // ✅ Enter 키 이벤트 처리
                  if (event.key === "Enter") {
                    temp.filterOptionValue = filterValue.value;
                    if (searchFn) {
                      searchFn();
                    }
                    hide(); // ✅ 필터 메뉴 닫기
                  }
                },
              }),
              h(
                NButton,
                {
                  type: "primary",
                  strong: true,
                  secondary: true,
                  style: { width: "100%", marginTop: "8px" }, // ✅ 버튼 스타일
                  onClick: () => {
                    temp.filterOptionValue = filterValue.value;
                    if (searchFn) {
                      searchFn();
                    }
                    hide(); // ✅ 필터 메뉴 닫기
                  },
                },
                { default: () => "확인" }
              ),
            ],
          }
        );
      };
    }
    columns.push(temp);
  }
  return { columns, tableWidth };
}
